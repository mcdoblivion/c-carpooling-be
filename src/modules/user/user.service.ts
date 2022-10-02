import {
  BadRequestException,
  CACHE_MANAGER,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as argon from 'argon2'
import { Cache } from 'cache-manager'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { S3Service } from 'src/services/aws/s3.service'
import { MailService } from 'src/services/mail/mail.service'
import { SmsService } from 'src/services/sms/sms.service'
import { StripeService } from 'src/services/stripe/stripe.service'
import { UserEntity, UserProfileEntity } from 'src/typeorm/entities'
import { TwoFAMethod } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Brackets, In, IsNull, Not } from 'typeorm'
import { AuthService } from '../auth/auth.service'
import { BaseService } from '../base/base.service'
import { PaymentMethodService } from '../payment-method/payment-method.service'
import { CreateNewCardDto } from './dto/create-new-card.dto'
import { CreateNewPasswordDto } from './dto/create-new-password.dto'
import {
  UpdateUser2FAMethodDto,
  UpdateUserActivationStatusDto,
  UpdateUserDto,
  UpdateUserFirstTimeDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly mailsService: MailService,
    private readonly smsService: SmsService,
    private readonly stripeService: StripeService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {
    super(userRepository)
  }

  findById(id: number): Promise<UserEntity> {
    if (!id) {
      throw new BadRequestException('User ID is required!')
    }

    return this.userRepository.findOneBy({
      id,
      deletedAt: IsNull(),
    })
  }

  async searchUsers({
    page,
    limit,
    search,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<UserEntity>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userProfile', 'userProfile')
      .leftJoin('user.driver', 'driver')
      .where('user.deletedAt IS NULL')

    const { isActive, role, completedProfile, isDriver } = filters

    if (typeof completedProfile === 'boolean') {
      queryBuilder.andWhere(
        `userProfile.id IS ${completedProfile ? 'NOT' : ''} NULL`,
      )
    }

    if (typeof isDriver === 'boolean') {
      queryBuilder.andWhere(`driver.id IS ${isDriver ? 'NOT' : ''} NULL`)
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive,
      })
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role })
    }

    if (search) {
      search = `%${search.toUpperCase()}%`

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(user.username) LIKE :search', { search })
            .orWhere('UPPER(user.email) LIKE :search', { search })
            .orWhere(
              `UPPER(CONCAT(userProfile.firstName, ' ', userProfile.lastName)) LIKE :search`,
              { search },
            )
        }),
      )
    }

    sort = sort.split('.').length > 1 ? sort : `user.${sort}`
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order, 'NULLS LAST')

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult(
      records,
      page,
      limit,
      search,
      filters,
      sort,
      order,
      total,
    )
  }

  async getUserDetails(id: number): Promise<UserEntity> {
    const user = await this.findOne(
      { id },
      {
        relations: {
          carpoolingGroup: true,
          driver: {
            vehicles: true,
          },
          wallet: true,
          paymentMethods: true,
          userProfile: true,
          addresses: true,
        },
      },
    )

    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    return user
  }

  async createProfile(
    id: number,
    { username, phoneNumber, userProfile }: UpdateUserFirstTimeDto,
  ): Promise<UserEntity> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const userRepository = queryRunner.manager.getRepository(UserEntity)
      const userProfileRepository =
        queryRunner.manager.getRepository(UserProfileEntity)

      const existingUser = await userRepository.findOne({
        where: { id },
        relations: {
          userProfile: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} does not exist!`)
      }

      if (existingUser.userProfile) {
        throw new BadRequestException(`User has already created profile!`)
      }

      if (username) {
        const userWithSameUsername = await userRepository.findOne({
          where: {
            username,
            id: Not(id),
            deletedAt: null,
          },
        })

        if (userWithSameUsername) {
          throw new BadRequestException(
            `User with username ${username} already exists!`,
          )
        }

        existingUser.username = username
      }

      const userWithSamePhoneNumber = await userRepository.findOne({
        where: {
          phoneNumber,
          id: Not(id),
          deletedAt: null,
        },
      })

      if (userWithSamePhoneNumber) {
        throw new BadRequestException(
          `User with phone number ${phoneNumber} already exists!`,
        )
      }

      existingUser.phoneNumber = phoneNumber

      await userRepository.save(existingUser)

      const createdUserProfile = await userProfileRepository.save({
        ...userProfile,
        userId: id,
      })

      existingUser.userProfile = createdUserProfile

      await queryRunner.commitTransaction()
      return existingUser
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      queryRunner.release()
    }
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const userRepository = queryRunner.manager.getRepository(UserEntity)
      const userProfileRepository =
        queryRunner.manager.getRepository(UserProfileEntity)

      const existingUser = await userRepository.findOne({
        where: { id },
        relations: {
          userProfile: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} does not exist!`)
      }

      const { username, phoneNumber, userProfile } = updateUserDto

      if (username) {
        const userWithSameUsername = await userRepository.findOne({
          where: {
            username,
            id: Not(id),
            deletedAt: null,
          },
        })

        if (userWithSameUsername) {
          throw new BadRequestException(
            `User with username ${username} already exists!`,
          )
        }

        existingUser.username = username
      }

      if (phoneNumber) {
        const userWithSamePhoneNumber = await userRepository.findOne({
          where: {
            phoneNumber,
            id: Not(id),
            deletedAt: null,
          },
        })

        if (userWithSamePhoneNumber) {
          throw new BadRequestException(
            `User with phone number ${phoneNumber} already exists!`,
          )
        }

        existingUser.phoneNumber = phoneNumber
      }

      await userRepository.save(existingUser)

      if (userProfile) {
        existingUser.userProfile = {
          ...existingUser.userProfile,
          ...userProfile,
        }

        await userProfileRepository.save(existingUser.userProfile)
      }

      await queryRunner.commitTransaction()
      return existingUser
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      queryRunner.release()
    }
  }

  async updateUserPassword(
    id: number,
    { currentPassword, newPassword }: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    const existingUser = await this.findOne(
      {
        id,
        deletedAt: null,
      },
      {
        select: {
          password: true,
        },
      },
    )

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    const { password: hashPassword } = existingUser
    if (!(await argon.verify(hashPassword, currentPassword))) {
      throw new UnauthorizedException(`Password is incorrect!`)
    }

    const newHashPassword = await argon.hash(newPassword)

    return this.update(id, { password: newHashPassword })
  }

  async updateUser2FAMethod(
    id: number,
    { twoFAMethod, otp }: UpdateUser2FAMethodDto,
  ) {
    if (otp) {
      const userId = await this.authService.verifyOtp(otp)

      if (userId !== id) {
        throw new BadRequestException(`OTP is invalid or expired!`)
      }

      const existingUser = await this.findById(userId)
      if (!existingUser) {
        throw new BadRequestException(`OTP is invalid or expired!`)
      }

      existingUser['2FAMethod'] = twoFAMethod
      await this.userRepository.save(existingUser)

      return '2FA method has been changed successfully!'
    }

    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    const vTwoFAMethod =
      existingUser['2FAMethod'] !== TwoFAMethod.OFF
        ? existingUser['2FAMethod']
        : TwoFAMethod.EMAIL

    return this.authService.sendOtp({
      twoFAMethod: vTwoFAMethod,
      usernameOrEmail: existingUser.email,
    })
  }

  async updateUserActivationStatus(
    id: number,
    { isActive }: UpdateUserActivationStatusDto,
  ) {
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    existingUser.isActive = isActive

    await this.userRepository.save(existingUser)

    return existingUser
  }

  async createNewPassword({
    otp,
    usernameOrEmail,
    newPassword,
  }: CreateNewPasswordDto) {
    if (otp) {
      const userId = await this.authService.verifyOtp(otp)

      const existingUser = await this.findById(userId)
      if (!existingUser) {
        throw new BadRequestException(`OTP is invalid or expired!`)
      }

      const { username, email } = existingUser
      if (usernameOrEmail !== username && usernameOrEmail !== email) {
        throw new BadRequestException(`OTP is invalid or expired!`)
      }

      const hashPassword = await argon.hash(newPassword)
      existingUser.password = hashPassword
      await this.userRepository.save(existingUser)

      return 'Password changed successfully!'
    }

    const existingUser = await this.findOne([
      { username: usernameOrEmail },
      { email: usernameOrEmail },
    ])

    if (!existingUser) {
      throw new BadRequestException(
        `User with username/email ${usernameOrEmail} does not exist!`,
      )
    }

    const twoFAMethod =
      existingUser['2FAMethod'] !== TwoFAMethod.OFF
        ? existingUser['2FAMethod']
        : TwoFAMethod.EMAIL

    return this.authService.sendOtp({ twoFAMethod, usernameOrEmail })
  }

  async deleteUser(id: number) {
    const existingUser = await this.findById(id)

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    return this.update(id, { deletedAt: new Date() })
  }

  // Payment

  async addNewCard(
    userId: number,
    { cardNumber, expiredMonth, expiredYear, cvc }: CreateNewCardDto,
  ) {
    const existingPaymentMethod = await this.paymentMethodService.findOne({
      userId,
    })

    let stripeCustomerId = ''
    if (existingPaymentMethod) {
      stripeCustomerId = existingPaymentMethod.stripeCustomerId
    } else {
      const stripeCustomer = await this.stripeService.customers.create()
      stripeCustomerId = stripeCustomer.id
    }

    const stripePaymentMethod = await this.stripeService.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expiredMonth,
        exp_year: expiredYear,
        cvc: cvc.toString(),
      },
    })

    const {
      id: stripePaymentMethodId,
      card: { brand, last4 },
    } = stripePaymentMethod

    const [paymentMethod, stripeSetupIntent] = await Promise.all([
      this.paymentMethodService.create({
        userId,
        lastFourDigits: last4,
        cardType: brand,
        stripePaymentMethodId,
        stripeCustomerId,
      }),

      this.stripeService.setupIntents.create({
        customer: stripeCustomerId,
        payment_method: stripePaymentMethodId,
      }),
    ])

    return { paymentMethod, stripeSetupIntent }
  }

  getCardList(userId: number) {
    return this.paymentMethodService.findAll({ userId })
  }

  async deleteCard(userId: number, cardId: number) {
    const existingCard = await this.paymentMethodService.findById(cardId)

    if (!existingCard) {
      throw new NotFoundException(`Card with ID ${cardId} does not exist!`)
    }

    if (existingCard.userId !== userId) {
      throw new ForbiddenException(
        'You are only allowed to delete your own card!',
      )
    }

    const allUserCards = await this.paymentMethodService.findAll({ userId })
    if (allUserCards.length === 1) {
      throw new ForbiddenException(
        'Please add another card before deleting your only card!',
      )
    }

    return this.paymentMethodService.delete(cardId)
  }

  async isOwnCards(userId: number, ...cardIds: number[]): Promise<boolean> {
    const existingCards = await this.paymentMethodService.findAll({
      id: In(cardIds),
    })

    if (!existingCards.length) {
      return false
    }

    for (const { userId: vUserId } of existingCards) {
      if (userId !== vUserId) {
        return false
      }
    }

    return true
  }
}
