import { Injectable } from '@nestjs/common'
import { CarpoolingGroupEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'
import { UpdateCarpoolingGroupDto } from './dto/update-carpooling-group.dto'

@Injectable()
export class CarpoolingGroupService extends BaseService<CarpoolingGroupEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(CarpoolingGroupEntity))
  }
}
