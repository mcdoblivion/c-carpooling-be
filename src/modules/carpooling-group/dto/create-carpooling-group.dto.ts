import { IsInt, IsMilitaryTime, IsPositive, IsString } from 'class-validator'

export class CreateCarpoolingGroupDto {
  @IsString()
  groupName: string

  @IsMilitaryTime()
  departureTime: string

  @IsMilitaryTime()
  comebackTime: string

  @IsInt()
  @IsPositive()
  delayDurationInMinutes: number
}
