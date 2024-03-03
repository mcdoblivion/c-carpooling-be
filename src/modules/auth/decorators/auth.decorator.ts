import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { Role } from 'src/typeorm/enums'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RolesGuard } from '../guards/role.guard'
import { Roles } from './role.decorator'

export const Auth = (...roles: Role[]) => {
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard))
}

export const Public = () => SetMetadata('isPublic', true)
