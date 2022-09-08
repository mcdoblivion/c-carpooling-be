import { SetMetadata } from '@nestjs/common'
import { Role } from 'src/typeorm/enums'

export const ROLE_KEY = 'ROLE_KEY'
export const Roles = (...roles: Role[]) => SetMetadata(ROLE_KEY, roles)
