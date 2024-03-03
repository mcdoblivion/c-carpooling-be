import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    })
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateEmailAndPassword(
        email,
        password,
      )

      return { ...user }
    } catch (error) {
      throw new UnauthorizedException(error, error.message)
    }
  }
}
