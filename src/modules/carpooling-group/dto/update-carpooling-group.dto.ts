import { PartialType } from '@nestjs/swagger'
import { CreateCarpoolingGroupDto } from './create-carpooling-group.dto'

export class UpdateCarpoolingGroupDto extends PartialType(
  CreateCarpoolingGroupDto,
) {}
