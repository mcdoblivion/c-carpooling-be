import { PartialType } from '@nestjs/mapped-types'
import { CreateCarpoolingGroupDto } from './create-carpooling-group.dto'

export class UpdateCarpoolingGroupDto extends PartialType(
  CreateCarpoolingGroupDto,
) {}
