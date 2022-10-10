import { Injectable } from '@nestjs/common'
import { AddressEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class AddressService extends BaseService<AddressEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(AddressEntity))
  }
}
