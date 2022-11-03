import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { LeaveGroupRequestService as LeaveGroupCronJob } from 'src/cron-jobs/process-leave-group-request/leave-group-request.service'
import { UpdateCarpoolingLogService } from 'src/cron-jobs/update-carpooling-log/update-carpooling-log.service'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { CronJobEntity } from 'src/typeorm/entities'
import { CronJobType } from 'src/typeorm/enums/cron-job-type'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Brackets } from 'typeorm'
import { BaseService } from '../base/base.service'

@Injectable()
export class CronJobService extends BaseService<CronJobEntity> {
  constructor(
    private readonly typeOrmService: TypeOrmService,
    @Inject(forwardRef(() => LeaveGroupCronJob))
    private readonly leaveGroupCronJob: LeaveGroupCronJob,
    @Inject(forwardRef(() => UpdateCarpoolingLogService))
    private readonly updateCarpoolingLogCronJob: UpdateCarpoolingLogService,
  ) {
    super(typeOrmService.getRepository(CronJobEntity))
  }

  async searchCronJob({
    page,
    limit,
    search,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<CronJobEntity>> {
    const queryBuilder = this.getRepository().createQueryBuilder('job')

    if (search) {
      search = `%${search.toUpperCase()}%`

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(job.name) LIKE :search', { search }).orWhere(
            'UPPER(job.description) LIKE :search',
            { search },
          )
        }),
      )
    }

    const { type, isProcessed } = filters as {
      type: CronJobType
      isProcessed: boolean
    }

    if (type) {
      queryBuilder.andWhere('job.type = :type', { type })
    }

    if (typeof isProcessed === 'boolean') {
      queryBuilder.andWhere(
        `job.finishedAt IS ${isProcessed ? 'NOT' : ''} NULL`,
      )
    }

    sort = sort.split('.').length > 1 ? sort : `job.${sort}`

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order)

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult(
      records,
      page,
      limit,
      search,
      filters,
      sort,
      order,
      total,
    )
  }

  async triggerCronJobById(id: number) {
    const existingCronJob = await this.findById(id)

    if (!existingCronJob) {
      throw new NotFoundException(`Cron job with ID ${id} does not exist!`)
    }

    if (existingCronJob.finishedAt) {
      throw new BadRequestException(
        `Cron job with ID ${id} has already processed!`,
      )
    }

    const type = existingCronJob.type

    if (type === CronJobType.LEAVE_GROUP_REQUEST) {
      this.leaveGroupCronJob.processLeaveGroupRequests(id)
    } else if (type === CronJobType.CARPOOLING_LOG) {
      this.updateCarpoolingLogCronJob.updateCarpoolingLogs(id)
    } else {
      throw new Error('This method is not supported!')
    }

    return `Cron job with ID ${id} is running...`
  }
}
