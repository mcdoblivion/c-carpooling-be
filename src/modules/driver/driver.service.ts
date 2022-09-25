import { Injectable } from '@nestjs/common'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { DriverEntity } from 'src/typeorm/entities'
import { RequestStatus } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Brackets } from 'typeorm'
import { BaseService } from '../base/base.service'
import { CreateDriverDto } from './dto/create-driver.dto'

@Injectable()
export class DriverService extends BaseService<DriverEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(DriverEntity))
  }

  async searchDrivers({
    page,
    limit,
    search,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<DriverEntity>> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('user.userProfile', 'userProfile')

    const { status } = filters as { status: RequestStatus }

    if (status) {
      queryBuilder.andWhere('driver.status = :status', { status })
    }

    if (search) {
      search = `%${search.toUpperCase()}%`

      queryBuilder.andWhere(
        new Brackets((qb) =>
          qb
            .where('driver.driverLicenseNumber LIKE :search', { search })
            .orWhere(
              `UPPER(CONCAT(userProfile.firstName, ' ', userProfile.lastName)) LIKE :search`,
              { search },
            ),
        ),
      )
    }

    sort = sort.split('.').length > 1 ? sort : `driver.${sort}`
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order, 'NULLS LAST')

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

  async registerToBecomeDriver(
    createDriverDto: CreateDriverDto & { userId: number },
  ): Promise<DriverEntity> {
    return this.create(createDriverDto)
  }
}
