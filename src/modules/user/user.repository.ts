import { Injectable } from '@nestjs/common'
import { UserEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { Repository } from 'typeorm'

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(private typeOrmService: TypeOrmService) {
    super(UserEntity, typeOrmService.createEntityManager())
  }
}
