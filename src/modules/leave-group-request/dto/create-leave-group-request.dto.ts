import { IsInt, IsISO8601, IsPositive } from 'class-validator'

export class CreateLeaveGroupRequestDto {
  @IsInt()
  @IsPositive()
  carpoolingGroupId: number

  @IsISO8601({ strict: true })
  date: string
}
