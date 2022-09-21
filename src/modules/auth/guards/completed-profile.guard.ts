import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserEntity } from 'src/typeorm/entities'

@Injectable()
export class CompletedProfileGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } =
      (context.switchToHttp().getRequest() as { user: UserEntity }) || {}

    const userProfile = user?.userProfile

    return !!userProfile
  }
}
