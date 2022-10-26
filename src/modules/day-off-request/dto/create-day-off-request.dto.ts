import { IsEnum, IsInt, IsISO8601, IsPositive } from 'class-validator'
import { DirectionType } from 'src/typeorm/enums'

export class CreateDayOffRequestDto {
  @IsInt()
  @IsPositive()
  carpoolingGroupId: number

  @IsISO8601({ strict: true })
  date: string

  @IsEnum(DirectionType)
  directionType: DirectionType
}
