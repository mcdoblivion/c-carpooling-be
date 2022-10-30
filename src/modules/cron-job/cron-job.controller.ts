import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SearchDto } from 'src/helpers/search.dto'
import { CronJobEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CronJobService } from './cron-job.service'

@ApiTags('Cron Jobs')
@Auth(Role.ADMIN)
@Controller('cron-jobs')
export class CronJobController implements BaseController<CronJobEntity> {
  constructor(private readonly cronJobService: CronJobService) {}

  @Get()
  search(@Query() searchDto: SearchDto): Promise<SearchResult<CronJobEntity>> {
    return this.cronJobService.searchCronJob(searchDto)
  }

  @Put(':id')
  triggerCronJobById(@Param('id', ParseIntPipe) id: number) {
    return this.cronJobService.triggerCronJobById(id)
  }
}
