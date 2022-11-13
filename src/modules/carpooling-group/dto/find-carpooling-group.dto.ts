import { IsMilitaryTime } from 'class-validator'

export class FindCarpoolingGroupDto {
  @IsMilitaryTime()
  departureTime: string

  @IsMilitaryTime()
  comebackTime: string
}
