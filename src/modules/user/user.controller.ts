import { Controller, Inject, LoggerService } from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { SearchDto } from 'src/helpers/search.dto'
import { UserEntity } from 'src/typeorm/entities'
import { SearchResult } from 'src/types'
import { BaseController } from '../base/base.controller'
import { UserService } from './user.service'

@Controller('users')
export class UserController implements BaseController<UserEntity> {
  constructor(
    private readonly usersService: UserService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  search(searchDto: SearchDto): Promise<SearchResult<UserEntity>> {
    throw new Error('Method not implemented.')
  }
  getAll(): Promise<UserEntity[]> {
    throw new Error('Method not implemented.')
  }
  getOneById(id: number): Promise<UserEntity> {
    throw new Error('Method not implemented.')
  }
  create(createDto: Record<string, any>): Promise<UserEntity> {
    throw new Error('Method not implemented.')
  }
  updateOneById(
    id: number,
    updateDto: Record<string, any>,
  ): Promise<UserEntity> {
    throw new Error('Method not implemented.')
  }
  deleteOneById(id: number): Promise<any> {
    throw new Error('Method not implemented.')
  }
  deleteMany({ IDs }: { IDs: number[] }): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
