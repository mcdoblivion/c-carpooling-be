import { Injectable } from '@nestjs/common'
import { PaymentMethodEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class PaymentMethodService extends BaseService<PaymentMethodEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(PaymentMethodEntity))
  }
}
