import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'
const config = new ConfigService()

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('SECRET'),
    })
  }

  async validate(payload: any) {
    try {
      const { id: userId } = payload

      const user = await this.authService.validateUserFromJwt(userId)

      return { ...user }
    } catch (error) {
      throw new UnauthorizedException(error, error.message)
    }
  }
}
