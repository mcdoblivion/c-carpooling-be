import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SearchDto } from 'src/helpers/search.dto'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { SearchResult } from 'src/types'
import { BaseController } from '../base/base.controller'
import { CarpoolingGroupService } from './carpooling-group.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'
import { UpdateCarpoolingGroupDto } from './dto/update-carpooling-group.dto'

@ApiTags('Carpooling Group')
@Controller('carpooling-groups')
export class CarpoolingGroupController
  implements BaseController<CarpoolingGroupEntity>
{
  constructor(
    private readonly carpoolingGroupService: CarpoolingGroupService,
  ) {}
  search(searchDto: SearchDto): Promise<SearchResult<CarpoolingGroupEntity>> {
    throw new Error('Method not implemented.')
  }
  getAll(): Promise<CarpoolingGroupEntity[]> {
    throw new Error('Method not implemented.')
  }
  getOneById(id: number): Promise<CarpoolingGroupEntity> {
    throw new Error('Method not implemented.')
  }
  create(
    createDto: Record<string, any>,
    createBy?: UserEntity,
  ): Promise<CarpoolingGroupEntity> {
    throw new Error('Method not implemented.')
  }
  updateOneById(
    id: number,
    updateDto: Record<string, any>,
    updateBy?: UserEntity,
  ): Promise<CarpoolingGroupEntity> {
    throw new Error('Method not implemented.')
  }
  deleteOneById(id: number): Promise<any> {
    throw new Error('Method not implemented.')
  }
  deleteMany({ IDs }: { IDs: number[] }): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
