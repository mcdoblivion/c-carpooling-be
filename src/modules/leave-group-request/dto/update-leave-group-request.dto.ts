import { PickType } from '@nestjs/swagger'
import { CreateLeaveGroupRequestDto } from './create-leave-group-request.dto'

export class UpdateLeaveGroupRequestDto extends PickType(
  CreateLeaveGroupRequestDto,
  ['date'],
) {}
