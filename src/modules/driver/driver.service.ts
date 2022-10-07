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
import { Brackets, IsNull } from 'typeorm'
import { BaseService } from '../base/base.service'
import { CarpoolingGroupService } from '../carpooling-group/carpooling-group.service'
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto'
import { UpdateVehicleDto } from '../vehicle/dto/update-vehicle.dto'
import { VehicleService } from '../vehicle/vehicle.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@Injectable()
export class DriverService extends BaseService<DriverEntity> {
  constructor(
    private readonly typeOrmService: TypeOrmService,
    private readonly vehicleService: VehicleService,
    private readonly carpoolingGroupService: CarpoolingGroupService,
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

  async updateVehicle(
    driverId: number,
    vehicleId: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleEntity> {
    const existingVehicle = await this.vehicleService.findOne(
      {
        id: vehicleId,
      },
      {
        relations: {
          driver: true,
        },
      },
    )

    if (!vehicleId) {
      throw new NotFoundException(
        `Vehicle with ID ${vehicleId} does not exist!`,
      )
    }

    if (existingVehicle.driverId !== driverId) {
      throw new ForbiddenException('This vehicle is not your!')
    }

    const {
      driver: { vehicleIdForCarpooling },
    } = existingVehicle

    if (vehicleId === vehicleIdForCarpooling) {
      throw new BadRequestException(
        `You are not allowed to update this vehicle because it's using for carpooling!`,
      )
    }

    return this.vehicleService.update(vehicleId, {
      ...updateVehicleDto,
      isVerified: false,
    })
  }

  async changeVehicleForCarpooling(
    driverId: number,
    userId: number,
    vehicleId: number,
  ) {
    const activeCarpoolingGroup = await this.carpoolingGroupService.findOne({
      driverUserId: userId,
      deletedAt: IsNull(),
    })

    if (activeCarpoolingGroup) {
      throw new BadRequestException(
        'You are only allowed to change the vehicle for carpooling if you are not in any active carpooling group!',
      )
    }

    return this.update(driverId, { vehicleIdForCarpooling: vehicleId })
  }

  async deleteVehicle(id: number, vehicleId: number) {
    const existingDriver = await this.findById(id)
    if (!existingDriver) {
      throw new NotFoundException(`Driver with ID ${id} does not exist!`)
    }

    if (existingDriver.vehicleIdForCarpooling === vehicleId) {
      throw new BadRequestException(
        `You are not allow to delete the vehicle used for carpooling!\nPlease choose another vehicle for carpooling then try again!`,
      )
    }

    return this.vehicleService.delete(vehicleId)
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
