import { applyDecorators, UseGuards } from '@nestjs/common'
import { Role } from 'src/typeorm/enums'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RolesGuard as RolesGuard } from '../guards/role.guard'
import { Roles } from './role.decorator'

export const Auth = (...roles: Role[]) => {
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard))
}
