import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { DriverEntity, VehicleEntity } from 'src/typeorm/entities'
import { RequestStatus } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Brackets } from 'typeorm'
import { BaseService } from '../base/base.service'
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto'
import { VehicleService } from '../vehicle/vehicle.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@Injectable()
export class DriverService extends BaseService<DriverEntity> {
  constructor(
    private readonly typeOrmService: TypeOrmService,
    private readonly vehicleService: VehicleService,
  ) {
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

  async updateDriver(
    id: number,
    { status }: UpdateDriverDto,
  ): Promise<DriverEntity> {
    const existingDriver = await this.findById(id)
    if (!existingDriver) {
      throw new NotFoundException(`Driver with ID ${id} does not exist!`)
    }

    if (existingDriver.status !== RequestStatus.PENDING) {
      throw new ForbiddenException('You have already processed this request!')
    }

    if (status === RequestStatus.PENDING) {
      throw new BadRequestException(
        'You are only able to accept or reject this request!',
      )
    }

    existingDriver.status = status

    return this.getRepository().save(existingDriver)
  }

  async getAllVehicles(id: number): Promise<VehicleEntity[]> {
    return this.vehicleService.findAll({ driverId: id })
  }

  async addVehicle(
    id: number,
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleEntity> {
    return this.vehicleService.create({ ...createVehicleDto, driverId: id })
  }

  async isValidDriver(driverId: number, userId: number): Promise<boolean> {
    const existingDriver = await this.findById(driverId)
    if (!existingDriver) {
      throw new NotFoundException(`Driver with ID ${driverId} does not exist!`)
    }

    if (existingDriver.userId !== userId) {
      return false
    }

    return true
  }
}
