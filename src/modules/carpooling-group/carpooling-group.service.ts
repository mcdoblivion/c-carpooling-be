import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { RequestStatus } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'
import { UserService } from '../user/user.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'
Dayjs.extend(utc)

@Injectable()
export class CarpoolingGroupService extends BaseService<CarpoolingGroupEntity> {
  constructor(
    private readonly typeOrmService: TypeOrmService,
    private readonly userService: UserService,
  ) {
    super(typeOrmService.getRepository(CarpoolingGroupEntity))
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
