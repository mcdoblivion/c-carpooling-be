import { Injectable } from '@nestjs/common'
import { VehicleEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class VehicleService extends BaseService<VehicleEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(VehicleEntity))
  }
}
