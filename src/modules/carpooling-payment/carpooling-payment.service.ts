import { Injectable } from '@nestjs/common'
import { CarpoolingPaymentEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class CarpoolingPaymentService extends BaseService<CarpoolingPaymentEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(CarpoolingPaymentEntity))
  }
}
