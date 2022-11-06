import { IsInt, IsPositive } from 'class-validator'

export class UpdateMainVehicleDto {
  @IsInt()
  @IsPositive()
  vehicleId: number
}
