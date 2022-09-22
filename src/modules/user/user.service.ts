import {
  BadRequestException,
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cache } from 'cache-manager'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { S3Service } from 'src/services/aws/s3.service'
import { MailService } from 'src/services/mail/mail.service'
import { SmsService } from 'src/services/sms/sms.service'
import { UserEntity } from 'src/typeorm/entities'
import { BaseService } from '../base/base.service'
import { UpdateUserPasswordDto } from './dto/update-user.dto'
import { UserRepository } from './user.repository'
import * as argon from 'argon2'
import { CreateNewPasswordDto } from './dto/create-new-password.dto'
import { AuthService } from '../auth/auth.service'
import { generateOtp } from 'src/helpers/generate-otp'
import { TwoFAMethod } from 'src/typeorm/enums'

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
  ) {
    super(userRepository)
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
}
