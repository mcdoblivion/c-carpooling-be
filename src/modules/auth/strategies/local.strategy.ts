import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'usernameOrEmail',
    })
  }

  async validate(usernameOrEmail: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUsernameOrEmailAndPassword(
        usernameOrEmail,
        password,
      )

      return { ...user }
    } catch (error) {
      throw new UnauthorizedException(error, error.message)
    }
  }
}
