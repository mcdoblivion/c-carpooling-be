import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon from 'argon2'
import { Cache } from 'cache-manager'
import { OAuth2Client } from 'google-auth-library'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { MailService } from 'src/services/mail/mail.service'
import { SmsService } from 'src/services/sms/sms.service'
import { TwoFAMethod } from 'src/typeorm/enums'
import { generateOtp } from '../../helpers/generate-otp'
import { UserService } from '../user/user.service'
import { SendOtpDto } from './dto/otp.dto'
import { SignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailsService: MailService,
    private readonly smsService: SmsService,
    private readonly oAuth2Client: OAuth2Client,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.oAuth2Client = new OAuth2Client(config.get<string>('GOOGLE_CLIENT_ID'))
  }

  async signup(signupDto: SignupDto) {
    const { email } = signupDto

    // Check if email is already exists
    const existEmail = await this.userService.findOne({
      email,
      deletedAt: null,
    })
    if (existEmail) {
      throw new BadRequestException(
        'This email address is already registered. Please use a different email address.',
      )
    }

    const otp = generateOtp()

    const otpExpiresInSeconds =
      parseInt(this.config.get<string>('OTP_EXPIRES_IN_MINUTES')) * 60

    this.cacheManager.set(otp, signupDto, {
      ttl: otpExpiresInSeconds,
    })

    await this.mailsService.sendEmail(
      this.mailsService.generateOtpMailOptions(email, otp),
    )

    return `OTP has been sent to ${email}!`
  }

  async createNewAccount(otp: string) {
    const signupDto = await this.cacheManager.get<SignupDto>(otp)
    if (!signupDto) {
      throw new BadRequestException('OTP is incorrect or expired!')
    }
    this.cacheManager.del(otp)

    const { email, password } = signupDto

    if (!email || !password) {
      throw new BadRequestException('OTP is incorrect or expired!')
    }

    // Check if email is already exists
    const existEmail = await this.userService.findOne({
      email,
      deletedAt: null,
    })
    if (existEmail) {
      throw new BadRequestException(
        'This email address is already registered. Please use a different email address.',
      )
    }

    const passwordHash = await argon.hash(password)

    return this.userService.create({ ...signupDto, password: passwordHash })
  }

  async validateUsernameOrEmailAndPassword(
    usernameOrEmail: string,
    password: string,
  ) {
    const user = await this.userService.findOne(
      [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      {
        select: {
          email: true,
          username: true,
          password: true,
          isActive: true,
          deletedAt: true,
        },
      },
    )

    if (!user) {
      throw new Error(`User ${usernameOrEmail} not found!`)
    }

    const {
      email,
      username,
      password: existingPassword,
      isActive,
      deletedAt,
    } = user

    if (!isActive || deletedAt) {
      throw new Error(`User ${usernameOrEmail} is not active or deleted`)
    }

    if (existingPassword && (await argon.verify(existingPassword, password))) {
      return { email, username, id: user.id }
    }

    throw new Error('Invalid Login ID or Password!')
  }

  async validateUserFromJwt(userId: number) {
    const user = await this.userService.findOne(
      { id: userId },
      {
        relations: {
          userProfile: true,
        },
      },
    )

    if (!user) {
      throw new Error(`User ${userId} not found!`)
    }

    const { isActive, deletedAt } = user

    if (!isActive || deletedAt) {
      throw new Error(`User ${userId} is not active or deleted`)
    }

    return user
  }

  async validateGoogleToken(token: string) {
    // const ticket = await this.oAuth2Client.verifyIdToken({
    //   idToken: token,
    // })
    // const payload = ticket.getPayload()
    // const {
    //   given_name: firstName,
    //   family_name: lastName,
    //   email,
    //   picture: profilePhotoDestination,
    // } = payload
    // const queryRunner =
    //   this.userRepository.manager.connection.createQueryRunner()
    // await queryRunner.connect()
    // await queryRunner.startTransaction()
    // try {
    //   const userRepository = queryRunner.manager.getRepository(UserEntity)
    //   const userProfileRepository =
    //     queryRunner.manager.getRepository(UserProfileEntity)
    //   const languageRepository =
    //     queryRunner.manager.getRepository(LanguageEntity)
    //   const existUser = await userRepository.findOneBy({ email })
    //   if (existUser) {
    //     existUser.googleLoginHash = token
    //     await userRepository.save(existUser)
    //     const userProfileId = existUser.userProfileID
    //     await userProfileRepository.update(
    //       { id: userProfileId },
    //       {
    //         firstName,
    //         lastName,
    //         profilePhotoDestination,
    //       },
    //     )
    //   } else {
    //     const [language] = await languageRepository.find()
    //     const userProfile = await userProfileRepository.save({
    //       firstName,
    //       lastName,
    //       profilePhotoDestination,
    //       languageID: language.id,
    //     })
    //     await userRepository.save({
    //       email,
    //       googleLoginHash: token,
    //       userProfileID: userProfile.id,
    //     })
    //   }
    //   await queryRunner.commitTransaction()
    //   const user = await this.userRepository.findOneBy({ email })
    //   this.userService.update(user.id, { lastLogin: new Date() })
    //   return { access_token: this.jwtService.sign({ email, id: user.id }) }
    // } catch (error) {
    //   await queryRunner.rollbackTransaction()
    //   throw error
    // } finally {
    //   await queryRunner.release()
    // }
  }

  async login(
    user: { id: number; email: string; username: string },
    otp: string,
  ) {
    if (otp) {
      const { userId } =
        (await this.cacheManager.get<{ userId: number }>(otp)) || {}

      if (!userId) {
        throw new BadRequestException('OTP is invalid of expired!')
      }

      this.cacheManager.del(otp)

      user.id = userId
    }

    const existUser = await this.userService.findOne({ id: user.id })
    if (!existUser) {
      throw new BadRequestException('Invalid Login ID or Password')
    }

    const twoFAMethod = existUser['2FAMethod']
    if (twoFAMethod === TwoFAMethod.OFF || otp) {
      return this.generateAccessToken(user)
    }

    return this.sendOtp({ twoFAMethod, usernameOrEmail: user.email })
  }

  generateAccessToken(user: any) {
    const payload = { ...user }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { twoFAMethod, usernameOrEmail } = sendOtpDto

    const existUser = await this.userService.findOne([
      { email: usernameOrEmail },
      { username: usernameOrEmail },
    ])

    if (!existUser) {
      throw new BadRequestException(
        'Invalid username or email. Please try again.',
      )
    }

    const otp = generateOtp()
    const otpExpiresInSeconds =
      parseInt(this.config.get<string>('OTP_EXPIRES_IN_MINUTES')) * 60

    switch (twoFAMethod) {
      case TwoFAMethod.EMAIL:
        const userEmail = existUser.email

        await this.mailsService.sendEmail(
          this.mailsService.generateOtpMailOptions(userEmail, otp),
        )
        break

      case TwoFAMethod.SMS:
        const phoneNumber = existUser.phoneNumber
        await this.smsService.sendMessage(
          this.smsService.generateOtpMessageOptions(phoneNumber, otp),
        )
        break

      default:
        throw new BadRequestException(`Invalid 2FA method: ${twoFAMethod}`)
    }

    this.cacheManager.set(
      otp,
      { userId: existUser.id },
      { ttl: otpExpiresInSeconds },
    )

    return 'OTP has been sent!'
  }
}
