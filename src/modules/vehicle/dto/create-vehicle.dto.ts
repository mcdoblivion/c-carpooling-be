import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator'
import { FuelType } from 'src/typeorm/enums'

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  registrationCertificateNumber: string

  @IsUrl()
  registrationCertificateFrontPhotoURL: string

  @IsUrl()
  registrationCertificateBackPhotoURL: string

  @IsString()
  @IsNotEmpty()
  licensePlate: string

  @IsInt()
  @IsPositive()
  numberOfSeats: number

  @IsString()
  @IsNotEmpty()
  brand: string

  @IsString()
  @IsNotEmpty()
  color: string

  @IsInt()
  @IsPositive()
  fuelConsumptionPer100kms: number

  @IsEnum(FuelType)
  fuelType: FuelType

  @IsUrl()
  photoURL: string
}
