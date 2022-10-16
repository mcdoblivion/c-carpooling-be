import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import getDistance from '@turf/distance'
import { point } from '@turf/helpers'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { AddressType, RequestStatus } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'
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
    const { latitude: userHomeLatitude, longitude: userHomeLongitude } =
      userAddresses.find((address) => address.type === AddressType.HOME)
    const { latitude: userWorkLatitude, longitude: userWorkLongitude } =
      userAddresses.find((address) => address.type === AddressType.WORK)

    const userHomePoint = point([+userHomeLongitude, +userHomeLatitude])
    const userWorkPoint = point([+userWorkLongitude, +userWorkLatitude])

    const maximumDistance = this.config.get<number>(
      'CARPOOLING_MAXIMUM_DISTANCE_IN_METERS',
    )

    const carpoolingGroupsWithValidAddresses = carpoolingGroups
      .map((carpoolingGroup) => {
        const {
          driverUser: { addresses },
        } = carpoolingGroup

        const { latitude: homeLatitude, longitude: homeLongitude } =
          addresses.find((address) => address.type === AddressType.HOME)
        const { latitude: workLatitude, longitude: workLongitude } =
          addresses.find((address) => address.type === AddressType.WORK)

        const homePoint = point([+homeLongitude, +homeLatitude])
        const workPoint = point([+workLongitude, +workLatitude])

        const homeDistance = getDistance(userHomePoint, homePoint, {
          units: 'meters',
        })
        const workDistance = getDistance(userWorkPoint, workPoint, {
          units: 'meters',
        })

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
}
