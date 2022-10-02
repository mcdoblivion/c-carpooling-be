import { Injectable } from '@nestjs/common'
import { WalletTransactionEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class WalletTransactionService extends BaseService<WalletTransactionEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(WalletTransactionEntity))
  }
}
