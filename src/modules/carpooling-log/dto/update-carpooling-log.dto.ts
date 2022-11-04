import { PartialType } from '@nestjs/swagger'
import { CreateCarpoolingLogDto } from './create-carpooling-log.dto'

export class UpdateCarpoolingLogDto extends PartialType(
  CreateCarpoolingLogDto,
) {}
