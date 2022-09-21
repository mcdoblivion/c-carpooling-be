import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  LoggerService,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { UserEntity } from 'src/typeorm/entities'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(signupDto)
    } catch (error) {
      this.logger.error('Error when signup!')
      throw error
    }
  }

  @Post('verify-signup')
  async verifySignup(@Body('otp') otp: string) {
    try {
      return await this.authService.createNewAccount(otp)
    } catch (error) {
      this.logger.error('Error when verifying signup!')
      throw error
    }
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req: { user: UserEntity }, @Body('otp') otp: string) {
    try {
      return await this.authService.login(req.user, otp)
    } catch (error) {
      this.logger.error('Error when login!')
      throw error
    }
  }

  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('token') token: string) {
    try {
      return await this.authService.validateGoogleToken(token)
    } catch (error) {
      this.logger.error('Error when validating google token!')
      throw error
    }
  }
}
