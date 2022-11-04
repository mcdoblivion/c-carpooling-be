import { Injectable } from '@nestjs/common'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { CarpoolingLogEntity } from 'src/typeorm/entities'
import { DirectionType } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { BaseService } from '../base/base.service'

@Injectable()
export class CarpoolingLogService extends BaseService<CarpoolingLogEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(CarpoolingLogEntity))
  }

  async searchCarpoolingLogs({
    page,
    limit,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<CarpoolingLogEntity>> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('carpoolingLog')
      .leftJoinAndSelect('carpoolingLog.carpoolingGroup', 'carpoolingGroup')
      .leftJoin('carpoolingLog.user', 'user')
      .leftJoin('user.userProfile', 'userProfile')
      .addSelect(['user.id', 'userProfile.firstName', 'userProfile.lastName'])

    const { userId, carpoolingGroupId, directionType, date, isAbsent } =
      filters as {
        userId: number
        carpoolingGroupId: number
        directionType: DirectionType
        date: string
        isAbsent: boolean
      }

    if (userId) {
      queryBuilder.andWhere('carpoolingLog.userId = :userId', { userId })
    }

    if (carpoolingGroupId) {
      queryBuilder.andWhere(
        'carpoolingLog.carpoolingGroupId = :carpoolingGroupId',
        { carpoolingGroupId },
      )
    }

    if (directionType) {
      queryBuilder.andWhere('carpoolingLog.directionType = :directionType', {
        directionType,
      })
    }

    if (date) {
      queryBuilder.andWhere('carpoolingLog.date = :date', { date })
    }

    if (typeof isAbsent === 'boolean') {
      queryBuilder.andWhere('carpoolingLog.isAbsent = :isAbsent', {
        isProcessed: isAbsent,
      })
    }

    sort = sort.split('.').length > 1 ? sort : `carpoolingLog.${sort}`
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order)

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult(
      records,
      page,
      limit,
      null,
      filters,
      sort,
      order,
      total,
    )
  }
}
