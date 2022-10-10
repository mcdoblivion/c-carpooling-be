import { OmitType } from '@nestjs/swagger'
import { CreateAddressDto } from './create-address.dto'

export class UpdateAddressDto extends OmitType(CreateAddressDto, ['type']) {}
