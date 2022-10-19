import { IsDateString, IsInt, IsPositive, IsString } from 'class-validator'

export class CreateCarpoolingGroupDto {
  @IsString()
  groupName: string

  @IsDateString()
  departureTime: Date

  @IsDateString()
  comebackTime: Date

  @IsInt()
  @IsPositive()
  delayDurationInMinutes: number
}
