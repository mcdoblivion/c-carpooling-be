import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon from 'argon2'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { UserService } from '../user/user.service'
import { SignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password } = signupDto

    // Check if email is already exists
    const existEmail = await this.userService.findOne({ email })
    if (existEmail) {
      throw new BadRequestException(
        'This email address is already registered. Please use a different email address.',
      )
    }

    const passwordHash = await argon.hash(password)

    return this.userService.create({ ...signupDto, password: passwordHash })
  }

  async validateEmailAndPassword(email: string, password: string) {
    const user = await this.userService.findOne(
      { email },
      {
        select: {
          id: true,
          email: true,
          password: true,
        },
      },
    )

    if (!user) {
      throw new Error(`User ${email} not found!`)
    }

    const { password: existingPassword } = user

    if (existingPassword && (await argon.verify(existingPassword, password))) {
      return { email, id: user.id }
    }

    throw new Error('Invalid Login ID or Password!')
  }

  async validateUserFromJwt(userId: number) {
    const user = await this.userService.findById(userId)

    if (!user) {
      throw new Error(`User ${userId} not found!`)
    }

    return user
  }

  async login(user: { id: number }) {
    const existUser = await this.userService.findById(user.id)
    if (!existUser) {
      throw new BadRequestException('Invalid Login ID or Password')
    }

    return this.generateAccessToken(user)
  }

  generateAccessToken(user: any) {
    const payload = { ...user }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
