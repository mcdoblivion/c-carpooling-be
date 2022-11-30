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
import { DayjsWeekDay } from 'src/constants/week-day'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import {
  AddressEntity,
  CarpoolingGroupEntity,
  CarpoolingPaymentEntity,
  UserEntity,
  WalletEntity,
  WalletTransactionEntity,
} from 'src/typeorm/entities'
import {
  AddressType,
  FuelType,
  RequestStatus,
  WalletActionType,
} from 'src/typeorm/enums'
import { WalletTransactionStatus } from 'src/typeorm/enums/wallet-transaction-status'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Brackets } from 'typeorm'
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

  async findCarpoolingGroups(
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
        `("carpoolingGroup"."departureTime"::TIME - CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) <= :departureTime::TIME`,
        {
          departureTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."departureTime"::TIME + CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) > :departureTime::TIME`,
        {
          departureTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."comebackTime"::TIME - CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) <= :comebackTime::TIME`,
        {
          comebackTime,
        },
      )
      .andWhere(
        `("carpoolingGroup"."comebackTime"::TIME + CONCAT("carpoolingGroup"."delayDurationInMinutes", ' minutes')::INTERVAL ) > :comebackTime::TIME`,
        {
          comebackTime,
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

        const homeDistance = this.getDistance(
          homeAddress,
          userHomeAddress,
          'meters',
        )
        const workDistance = this.getDistance(
          workAddress,
          userWorkAddress,
          'meters',
        )

        const departureTime = carpoolingGroup.departureTime
          .split(':')
          .slice(0, 2)
          .join(':')

        const comebackTime = carpoolingGroup.comebackTime
          .split(':')
          .slice(0, 2)
          .join(':')

        return {
          ...carpoolingGroup,
          homeDistance: Math.round(homeDistance),
          workDistance: Math.round(workDistance),
          departureTime,
          comebackTime,
        }
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

  async searchCarpoolingGroups({
    page,
    limit,
    search,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<CarpoolingGroupEntity>> {
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

    if (search) {
      search = `%${search.toUpperCase()}%`

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(carpoolingGroup.groupName) LIKE :search', {
            search,
          })
            .orWhere(
              `UPPER(CONCAT(userProfile.firstName, ' ', userProfile.lastName)) LIKE :search`,
              { search },
            )
            .orWhere('UPPER(vehicleForCarpooling.brand) LIKE :search', {
              search,
            })
        }),
      )
    }

    sort = sort.split('.').length > 1 ? sort : `carpoolingGroup.${sort}`
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order)

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult({
      records,
      page,
      limit,
      search,
      sort,
      order,
      total,
    })
  }

  async getCarpoolingGroupDetails(id: number): Promise<CarpoolingGroupEntity> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('carpoolingGroup')
      .leftJoin('carpoolingGroup.driverUser', 'driverUser')
      .leftJoin('driverUser.userProfile', 'driverUserProfile')
      .leftJoin('driverUser.driver', 'driver')
      .leftJoin('driver.vehicleForCarpooling', 'vehicleForCarpooling')
      .leftJoinAndSelect('driverUser.addresses', 'driverAddresses')
      .leftJoin('carpoolingGroup.carpoolers', 'carpoolerUser')
      .leftJoin('carpoolerUser.userProfile', 'carpoolerUserProfile')
      .addSelect([
        'driverUser.id',
        'driverUser.email',
        'driverUser.phoneNumber',
        'driverUserProfile.firstName',
        'driverUserProfile.lastName',
        'driverUserProfile.avatarURL',
        'driver.id',
        'vehicleForCarpooling.licensePlate',
        'vehicleForCarpooling.numberOfSeats',
        'vehicleForCarpooling.brand',
        'vehicleForCarpooling.color',
        'vehicleForCarpooling.photoURL',
        'carpoolerUser.id',
        'carpoolerUser.email',
        'carpoolerUser.phoneNumber',
        'carpoolerUserProfile.firstName',
        'carpoolerUserProfile.lastName',
        'carpoolerUserProfile.avatarURL',
      ])
      .where('carpoolingGroup.id = :id', { id })
      .andWhere('carpoolingGroup.deletedAt IS NULL')

    const carpoolingGroup = await queryBuilder.getOne()

    if (!carpoolingGroup) {
      throw new NotFoundException(
        `Carpooling group with ID ${id} does not exist!`,
      )
    }

    return carpoolingGroup
  }

  async createCarpoolingGroup(
    createCarpoolingGroupDto: CreateCarpoolingGroupDto,
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

      if (!existingUser.driver.vehicleIdForCarpooling) {
        throw new BadRequestException(
          'You need to select a vehicle for carpooling before creating a group!',
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

      const carpoolingGroup = await carpoolingGroupRepository.save({
        ...createCarpoolingGroupDto,
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

  async getCarpoolingFee(carpoolingGroupId: number): Promise<{
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
          vehicleForCarpooling: {
            fuelConsumptionPer100kms,
            fuelType,
            numberOfSeats,
          },
        },
        addresses,
      },
    } = carpoolingGroup

    if (carpoolers.length >= numberOfSeats) {
      throw new BadRequestException(
        'Carpooling group has already been enough members!',
      )
    }

    const fuelPrice = this.getCurrentFuelPrice(fuelType)
    const carpoolingDistanceInKms = this.getDistance(
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

    const pricePerUserPerMoveTurn = Math.round(pricePerMoveTurn / numberOfSeats)

    const remainingBusinessDaysInMonth =
      this.countRemainingBusinessDaysInMonth()

    const priceForCurrentMonth =
      pricePerUserPerMoveTurn * remainingBusinessDaysInMonth * 2

    const savingCostInPercentage = Math.round(
      ((pricePerMoveTurn - pricePerUserPerMoveTurn) / pricePerMoveTurn) * 100,
    )

    return {
      pricePerUserPerMoveTurn,
      priceForCurrentMonth,
      savingCostInPercentage,
    }
  }

  async joinCarpoolingGroup(carpoolingGroupId: number, userId: number) {
    const queryRunner = this.typeOrmService.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const userRepository = queryRunner.manager.getRepository(UserEntity)
      const walletRepository = queryRunner.manager.getRepository(WalletEntity)
      const walletTransactionRepository = queryRunner.manager.getRepository(
        WalletTransactionEntity,
      )
      const carpoolingPaymentRepository = queryRunner.manager.getRepository(
        CarpoolingPaymentEntity,
      )
      const carpoolingGroupRepository = queryRunner.manager.getRepository(
        CarpoolingGroupEntity,
      )

      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: {
          wallet: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      if (user.carpoolingGroupId) {
        throw new BadRequestException('You are already in a carpooling group!')
      }

      const [existingPayment, { priceForCurrentMonth }] = await Promise.all([
        carpoolingPaymentRepository.findOne({
          where: {
            userId,
            carpoolingGroupId,
            status: WalletTransactionStatus.PENDING,
          },
          order: {
            id: 'DESC',
          },
          lock: {
            mode: 'optimistic',
            version: 0,
          },
        }),

        this.getCarpoolingFee(carpoolingGroupId),
      ])

      if (
        !existingPayment ||
        existingPayment.carpoolingFee !== priceForCurrentMonth
      ) {
        throw new BadRequestException(
          'Carpooling fee has been changed. Please refresh and try again!',
        )
      }

      const {
        wallet: { id: walletId, currentBalance },
      } = user

      if (currentBalance < priceForCurrentMonth) {
        throw new BadRequestException(
          'Your balance is not enough for carpooling fee. Please top up then try again!',
        )
      }

      const carpoolingGroup = await carpoolingGroupRepository.findOne({
        where: {
          id: carpoolingGroupId,
        },
        relations: {
          driverUser: {
            driver: {
              vehicleForCarpooling: true,
            },
          },
          carpoolers: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      const {
        carpoolers,
        driverUser: {
          driver: {
            vehicleForCarpooling: { numberOfSeats },
          },
        },
      } = carpoolingGroup

      if (carpoolers.length >= numberOfSeats) {
        throw new BadRequestException(
          'Carpooling group has already been enough members!',
        )
      }

      user.carpoolingGroupId = carpoolingGroupId

      await Promise.all([
        userRepository.save(user),

        carpoolingPaymentRepository.update(
          { id: existingPayment.id },
          { status: WalletTransactionStatus.COMPLETED },
        ),

        walletRepository.decrement(
          { id: walletId },
          'currentBalance',
          priceForCurrentMonth,
        ),

        walletTransactionRepository.insert({
          walletId,
          actionType: WalletActionType.SPENT,
          value: priceForCurrentMonth,
          description: 'Join carpooling group!',
          status: WalletTransactionStatus.COMPLETED,
        }),
      ])

      await queryRunner.commitTransaction()

      return true
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      queryRunner.release()
    }
  }

  async updateCarpoolingPayment(
    carpoolingGroupId: number,
    userId: number,
    carpoolingFee: number,
  ): Promise<CarpoolingPaymentEntity> {
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
      return this.carpoolingPaymentService.create({
        userId,
        carpoolingGroupId,
        carpoolingFee,
      })
    } else {
      return this.carpoolingPaymentService.update(existingPayment.id, {
        carpoolingFee,
      })
    }
  }

  countRemainingBusinessDaysInMonth() {
    let currentDate = Dayjs()
    let count = 0

    const firstDayOfNextMonth = currentDate.add(1, 'months').startOf('month')

    while (firstDayOfNextMonth.diff(currentDate) > 0) {
      if (
        currentDate.day() !== DayjsWeekDay.SATURDAY &&
        currentDate.day() !== DayjsWeekDay.SUNDAY
      ) {
        ++count
      }

      currentDate = currentDate.add(1, 'days')
    }

    return count
  }

  getCurrentFuelPrice(fuelType: FuelType) {
    if (fuelType === FuelType.DIESEL) {
      return 20000
    } else if (fuelType === FuelType.GASOLINE) {
      return 25000
    }

    return 25000
  }

  getDistance(address1: AddressEntity, address2: AddressEntity, units: Units) {
    const { latitude: latitude1, longitude: longitude1 } = address1
    const { latitude: latitude2, longitude: longitude2 } = address2

    const point1 = point([+longitude1, +latitude1])
    const point2 = point([+longitude2, +latitude2])

    return getDistance(point1, point2, { units })
  }
}
