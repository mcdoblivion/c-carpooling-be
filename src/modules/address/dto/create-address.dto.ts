import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
} from 'class-validator'
import { AddressType } from 'src/typeorm/enums'

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  fullAddress: string

  @IsLongitude()
  longitude: string

  @IsLatitude()
  latitude: string

  @IsEnum(AddressType)
  type: AddressType
}
