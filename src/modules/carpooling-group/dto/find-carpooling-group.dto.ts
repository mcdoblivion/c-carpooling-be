import { IsDateString } from 'class-validator'

export class FindCarpoolingGroupDto {
  @IsDateString()
  departureTime: Date

  @IsDateString()
  comebackTime: Date
}
