import { IsEnum } from 'class-validator'
import { RequestStatus } from 'src/typeorm/enums'

export class UpdateDriverDto {
  @IsEnum(RequestStatus)
  status: RequestStatus
}
