import { IsNotEmpty, IsNumberString, IsUrl } from 'class-validator'

export class CreateDriverDto {
  @IsNumberString()
  @IsNotEmpty()
  driverLicenseNumber: string

  @IsUrl()
  driverLicenseFrontPhotoURL: string

  @IsUrl()
  driverLicenseBackPhotoURL: string
}
