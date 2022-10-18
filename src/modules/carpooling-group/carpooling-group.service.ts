import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import getDistance from '@turf/distance'
import { point, Units } from '@turf/helpers'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import {
  AddressEntity,
  CarpoolingGroupEntity,
  UserEntity,
} from 'src/typeorm/entities'
import { AddressType, FuelType, RequestStatus } from 'src/typeorm/enums'
import { WalletTransactionStatus } from 'src/typeorm/enums/wallet-transaction-status'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'
import { CarpoolingPaymentService } from '../carpooling-payment/carpooling-payment.service'
import { UserService } from '../user/user.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'
import { FindCarpoolingGroupDto } from './dto/find-carpooling-group.dto'
Dayjs.extend(utc)

@Injectable()
export class CarpoolingGroupService extends BaseService<CarpoolingGroupEntity> {
  constructor(
    private readonly config: ConfigService,
    private readonly typeOrmService: TypeOrmService,
    private readonly userService: UserService,
    private readonly carpoolingPaymentService: CarpoolingPaymentService,
  ) {
    super(typeOrmService.getRepository(CarpoolingGroupEntity))
  }

  async findCarpoolingGroupDto(
    { departureTime, comebackTime }: FindCarpoolingGroupDto,
    userId: number,
  ) {
    const user = await this.userService.findOne(
      { id: userId },
      {
        relations: {
          addresses: true,
        },
      },
    )

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} does not exist!`)
    }

    if (user?.addresses?.length !== 2) {
      throw new BadRequestException(
        'You need to add your addresses before finding carpooling groups!',
      )
    }

    const vDepartureTime = Dayjs.utc(departureTime)
      .startOf('minute')
      .toISOString()
      .split('T')[1]
    const vComebackTime = Dayjs.utc(comebackTime)
      .startOf('minute')
      .startOf('minute')
      .toISOString()
      .split('T')[1]

    const queryBuilder = this.getRepository()
      .createQueryBuilder('carpoolingGroup')
      .leftJoin('carpoolingGroup.driverUser', 'user')
      .leftJoin('user.userProfile', 'userProfile')
      .leftJoin('user.driver', 'driver')
      .leftJoin('driver.vehicleForCarpooling', 'vehicleForCarpooling')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .addSelect([
        'user.id',
        'userProfile.firstName',
        'userProfile.lastName',
        'userProfile.avatarURL',
        'driver.id',
        'vehicleForCarpooling.licensePlate',
        'vehicleForCarpooling.numberOfSeats',
        'vehicleForCarpooling.brand',
        'vehicleForCarpooling.color',
        'vehicleForCarpooling.photoURL',
      ])
      .loadRelationCountAndMap(
        'carpoolingGroup.carpoolerCount',
        'carpoolingGroup.carpoolers',
      )
      .where('carpoolingGroup.deletedAt IS NULL')
      .andWhere(
        `("carpoolingGroup"."departureTime"::TIME - CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) <= :vDepartureTime::TIME`,
        {
          vDepartureTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."departureTime"::TIME + CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) > :vDepartureTime::TIME`,
        {
          vDepartureTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."comebackTime"::TIME - CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) <= :vComebackTime::TIME`,
        {
          vComebackTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."comebackTime"::TIME + CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) > :vComebackTime::TIME`,
        {
          vComebackTime,
        },
      )

    const carpoolingGroups = (await queryBuilder.getMany()) as Array<
      CarpoolingGroupEntity & { carpoolerCount: number }
    >

    const userAddresses = user.addresses
    const userHomeAddress = userAddresses.find(
      (address) => address.type === AddressType.HOME,
    )
    const userWorkAddress = userAddresses.find(
      (address) => address.type === AddressType.WORK,
    )

    const maximumDistance = this.config.get<number>(
      'CARPOOLING_MAXIMUM_DISTANCE_IN_METERS',
    )

    const carpoolingGroupsWithValidAddresses = carpoolingGroups
      .map((carpoolingGroup) => {
        const {
          driverUser: { addresses },
        } = carpoolingGroup

        const homeAddress = addresses.find(
          (address) => address.type === AddressType.HOME,
        )
        const workAddress = addresses.find(
          (address) => address.type === AddressType.WORK,
        )

        const homeDistance = this._getDistance(
          homeAddress,
          userHomeAddress,
          'meters',
        )
        const workDistance = this._getDistance(
          workAddress,
          userWorkAddress,
          'meters',
        )

        return { ...carpoolingGroup, homeDistance, workDistance }
      })
      .filter(
        ({
          homeDistance,
          workDistance,
          carpoolerCount,
          driverUser: {
            driver: {
              vehicleForCarpooling: { numberOfSeats },
            },
          },
        }) => {
          return (
            homeDistance < maximumDistance &&
            workDistance < maximumDistance &&
            carpoolerCount < numberOfSeats
          )
        },
      )

    return {
      carpoolingGroups: carpoolingGroupsWithValidAddresses,
      total: carpoolingGroupsWithValidAddresses.length,
    }
  }

  async createCarpoolingGroup(
    { departureTime, comebackTime, ...rest }: CreateCarpoolingGroupDto,
    driverUserId: number,
  ): Promise<CarpoolingGroupEntity> {
    const queryRunner = this.typeOrmService.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const userRepository = queryRunner.manager.getRepository(UserEntity)
      const carpoolingGroupRepository = queryRunner.manager.getRepository(
        CarpoolingGroupEntity,
      )

      const existingUser = await userRepository.findOne({
        where: {
          id: driverUserId,
        },
        relations: {
          driver: true,
          addresses: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      if (!existingUser) {
        throw new NotFoundException(
          `User with ID ${driverUserId} does not exist!`,
        )
      }

      if (!existingUser.driver) {
        throw new ForbiddenException('You are not a driver!')
      }

      if (existingUser.driver.status !== RequestStatus.ACCEPTED) {
        throw new ForbiddenException(
          'Your request to become a driver has not been accepted yet!',
        )
      }

      if (existingUser.carpoolingGroupId) {
        throw new BadRequestException('You are already in a carpooling group!')
      }

      if (existingUser?.addresses?.length !== 2) {
        throw new BadRequestException(
          'You need to add your addresses before creating a carpooling group!',
        )
      }

      const vDepartureTime = Dayjs.utc(departureTime)
        .startOf('minute')
        .toISOString()
        .split('T')[1]

      const vComebackTime = Dayjs.utc(comebackTime)
        .startOf('minute')
        .toISOString()
        .split('T')[1]

      const carpoolingGroup = await carpoolingGroupRepository.save({
        ...rest,
        comebackTime: vComebackTime,
        departureTime: vDepartureTime,
        driverUserId,
      })

      existingUser.carpoolingGroupId = carpoolingGroup.id
      await userRepository.save(existingUser)

      await queryRunner.commitTransaction()

      return carpoolingGroup
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      queryRunner.release()
    }
  }

  async getCarpoolingFee(
    carpoolingGroupId: number,
    userId: number,
  ): Promise<{
    pricePerUserPerMoveTurn: number
    priceForCurrentMonth: number
    savingCostInPercentage: number
  }> {
    const carpoolingGroup = await this.findOne(
      { id: carpoolingGroupId },
      {
        relations: {
          driverUser: {
            driver: {
              vehicleForCarpooling: true,
            },
            addresses: true,
          },
          carpoolers: true,
        },
      },
    )

    if (!carpoolingGroup) {
      throw new NotFoundException(
        `Carpooling group with ID ${carpoolingGroupId} does not exist!`,
      )
    }

    const {
      carpoolers,
      driverUser: {
        driver: {
          vehicleForCarpooling: { fuelConsumptionPer100kms, fuelType },
        },
        addresses,
      },
    } = carpoolingGroup

    const fuelPrice = this._getCurrentFuelPrice(fuelType)
    const carpoolingDistanceInKms = this._getDistance(
      addresses[0],
      addresses[1],
      'kilometers',
    )

    const fuelConsumptionPerMoveTurn =
      (carpoolingDistanceInKms * fuelConsumptionPer100kms) / 100

    const rawPricePerMoveTurn = fuelPrice * fuelConsumptionPerMoveTurn

    const carpoolingFeeRateInPercentage = +this.config.get<number>(
      'CARPOOLING_FEE_RATE_IN_PERCENTAGE',
    )

    const pricePerMoveTurn =
      rawPricePerMoveTurn +
      (rawPricePerMoveTurn * carpoolingFeeRateInPercentage) / 100

    const numberOfCarpoolers = carpoolers.length + 1

    const pricePerUserPerMoveTurn = Math.round(
      pricePerMoveTurn / numberOfCarpoolers,
    )

    const remainingBusinessDaysInMonth =
      this._countRemainingBusinessDaysInMonth()

    const priceForCurrentMonth =
      pricePerUserPerMoveTurn * remainingBusinessDaysInMonth * 2

    const savingCostInPercentage = Math.round(
      ((pricePerMoveTurn - pricePerUserPerMoveTurn) / pricePerMoveTurn) * 100,
    )

    const existingPayment = await this.carpoolingPaymentService.findOne(
      {
        userId,
        carpoolingGroupId,
        status: WalletTransactionStatus.PENDING,
      },
      {
        order: {
          updatedAt: 'DESC',
        },
      },
    )

    if (!existingPayment) {
      await this.carpoolingPaymentService.create({
        userId,
        carpoolingGroupId,
        carpoolingFee: priceForCurrentMonth,
      })
    } else {
      await this.carpoolingPaymentService.update(existingPayment.id, {
        carpoolingFee: priceForCurrentMonth,
      })
    }

    return {
      pricePerUserPerMoveTurn,
      priceForCurrentMonth,
      savingCostInPercentage,
    }
  }

  private _countRemainingBusinessDaysInMonth() {
    let currentDate = Dayjs()
    let count = 0

    const firstDayOfNextMonth = currentDate.add(1, 'months').startOf('month')

    while (firstDayOfNextMonth.diff(currentDate) > 0) {
      if (currentDate.day() !== 0 && currentDate.day() !== 6) {
        ++count
      }

      currentDate = currentDate.add(1, 'days')
    }

    return count
  }

  private _getCurrentFuelPrice(fuelType: FuelType) {
    if (fuelType === FuelType.DIESEL) {
      return 20000
    } else if (fuelType === FuelType.GASOLINE) {
      return 25000
    }

    return 25000
  }

  private _getDistance(
    address1: AddressEntity,
    address2: AddressEntity,
    units: Units,
  ) {
    const { latitude: latitude1, longitude: longitude1 } = address1
    const { latitude: latitude2, longitude: longitude2 } = address2

    const point1 = point([+longitude1, +latitude1])
    const point2 = point([+longitude2, +latitude2])

    return getDistance(point1, point2, { units })
  }
}
