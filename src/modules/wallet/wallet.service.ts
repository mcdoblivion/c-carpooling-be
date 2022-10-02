import { Injectable } from '@nestjs/common'
import { WalletEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class WalletService extends BaseService<WalletEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(WalletEntity))
  }
}
