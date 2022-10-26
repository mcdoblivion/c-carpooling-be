import { PickType } from '@nestjs/swagger'
import { CreateDayOffRequestDto } from './create-day-off-request.dto'

export class UpdateDayOffRequestDto extends PickType(CreateDayOffRequestDto, [
  'date',
  'directionType',
]) {}
