import { Injectable } from '@nestjs/common'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { VehicleEntity } from 'src/typeorm/entities'
import { FuelType } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Brackets } from 'typeorm'
import { BaseService } from '../base/base.service'

@Injectable()
export class VehicleService extends BaseService<VehicleEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(VehicleEntity))
  }

  async searchVehicles({
    page,
    limit,
    search,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<VehicleEntity>> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.driver', 'driver')
      .leftJoin('driver.user', 'user')
      .leftJoin('user.userProfile', 'userProfile')
      .addSelect([
        'user.id',
        'userProfile.id',
        'userProfile.firstName',
        'userProfile.lastName',
      ])

    const { fuelType, isVerified } = filters as {
      fuelType: FuelType
      isVerified: boolean
    }

    if (fuelType) {
      queryBuilder.andWhere('vehicle.fuelType = :fuelType', { fuelType })
    }

    if (typeof isVerified === 'boolean') {
      queryBuilder.andWhere('vehicle.isVerified = :isVerified', { isVerified })
    }

    if (search) {
      search = `%${search.toUpperCase()}%`

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(vehicle.color) LIKE :search', { search })
            .orWhere('UPPER(vehicle.licensePlate) LIKE :search', { search })
            .orWhere('UPPER(vehicle.brand) LIKE :search', { search })
            .orWhere(
              `UPPER(CONCAT(userProfile.firstName, ' ', userProfile.lastName)) LIKE :search`,
              { search },
            )
        }),
      )
    }

    sort = sort.split('.').length > 1 ? sort : `vehicle.${sort}`

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order, 'NULLS LAST')

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult(
      records,
      total,
      limit,
      search,
      filters,
      sort,
      order,
      total,
    )
  }
}
