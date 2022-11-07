import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserEntity } from 'src/typeorm/entities'

@Injectable()
export class CompletedProfileGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    )

    if (isPublic) {
      return true
    }

    const requireCompletedProfile = this.reflector.get<boolean>(
      'requireCompletedProfile',
      context.getHandler(),
    )

    if (requireCompletedProfile === false) {
      return true
    }

    const { user } =
      (context.switchToHttp().getRequest() as { user: UserEntity }) || {}

    const userProfile = user?.userProfile

    return !!userProfile
  }
}
