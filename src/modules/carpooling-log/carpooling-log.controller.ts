import { Controller, ForbiddenException, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { CarpoolingLogEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CarpoolingLogService } from './carpooling-log.service'

@ApiTags('Carpooling Logs')
@Auth()
@Controller('carpooling-logs')
export class CarpoolingLogController
  implements BaseController<CarpoolingLogEntity>
{
  constructor(private readonly carpoolingLogService: CarpoolingLogService) {}

  @Get()
  search(
    @Query() searchDto: SearchDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<SearchResult<CarpoolingLogEntity>> {
    const role = user.role

    if (role === Role.NORMAL_USER) {
      searchDto.filters = { ...searchDto?.filters, userId: user.id }
    } else if (role !== Role.ADMIN) {
      throw new ForbiddenException()
    }

    return this.carpoolingLogService.searchCarpoolingLogs(searchDto)
  }
}
