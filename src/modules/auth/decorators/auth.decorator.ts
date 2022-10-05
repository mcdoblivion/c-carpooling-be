import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Role } from 'src/typeorm/enums'
import { CompletedProfileGuard } from '../guards/completed-profile.guard'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RolesGuard } from '../guards/role.guard'
import { Roles } from './role.decorator'

export const Auth = (...roles: Role[]) => {
  return applyDecorators(
    ApiBearerAuth(),
    Roles(...roles),
    UseGuards(JwtAuthGuard, CompletedProfileGuard, RolesGuard),
  )
}

export const AuthWithoutCompletedProfile = () =>
  SetMetadata('requireCompletedProfile', false)

export const Public = () => SetMetadata('isPublic', true)
