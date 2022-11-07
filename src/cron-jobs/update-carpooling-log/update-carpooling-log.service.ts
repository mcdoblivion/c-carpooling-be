import { forwardRef, Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { DayjsWeekDay } from 'src/constants/week-day'
import { CarpoolingGroupService } from 'src/modules/carpooling-group/carpooling-group.service'
import { CronJobService } from 'src/modules/cron-job/cron-job.service'
import { UserService } from 'src/modules/user/user.service'
import {
  CarpoolingGroupEntity,
  CarpoolingLogEntity,
  CronJobEntity,
  DayOffRequestEntity,
} from 'src/typeorm/entities'
import { DirectionType } from 'src/typeorm/enums'
import { CronJobType } from 'src/typeorm/enums/cron-job-type'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { In } from 'typeorm'
Dayjs.extend(utc)

@Injectable()
export class UpdateCarpoolingLogService {
  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly typeOrmService: TypeOrmService,
    @Inject(forwardRef(() => CronJobService))
    private readonly cronJobService: CronJobService,
    private readonly carpoolingGroupService: CarpoolingGroupService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'carpooling-logs',
    utcOffset: '+7',
  })
  async updateCarpoolingLogs(cronJobId: number) {
    const dayjsDate = Dayjs().utcOffset(7).subtract(1, 'days')
    const dateString = dayjsDate.format('YYYY-MM-DD')

    let cronJob: CronJobEntity

    try {
      if (cronJobId) {
        cronJob = await this.cronJobService.findById(cronJobId)

        if (!cronJob) {
          this.logger.error(`Cron job with ID ${cronJobId} does not exist!`)
          return
        }
      } else {
        if (
          dayjsDate.day() !== DayjsWeekDay.SATURDAY &&
          dayjsDate.day() !== DayjsWeekDay.SUNDAY
        ) {
          cronJob = await this.cronJobService.create({
            name: 'carpooling-logs',
            description: 'Update carpooling logs',
            type: CronJobType.CARPOOLING_LOG,
            date: dateString,
          })
        } else {
          return
        }
      }

      this.logger.log(`Start updating carpooling logs for ${dateString}...`)

      const carpoolingGroups = (await this.userService
        .getRepository()
        .createQueryBuilder('user')
        .where('user.deletedAt IS NULL')
        .andWhere('user.carpoolingGroupId IS NOT NULL')
        .select('COUNT(user.carpoolingGroupId)', 'carpoolerCount')
        .addSelect('user.carpoolingGroupId', 'carpoolingGroupId')
        .groupBy('user.carpoolingGroupId')
        .having('COUNT(user.carpoolingGroupId) > 1')
        .getRawMany()) as Array<{ carpoolingGroupId: number; count: number }>

      await Promise.all(
        carpoolingGroups.map((carpoolingGroup) =>
          this._updateCarpoolingLogs(
            carpoolingGroup.carpoolingGroupId,
            dateString,
          ),
        ),
      )

      cronJob.finishedAt = new Date()

      await this.cronJobService.getRepository().save(cronJob)

      this.logger.log(`Successfully updated carpooling logs for ${dateString}!`)
    } catch (error) {
      this.logger.error(`Failed to update carpooling logs for ${dateString}!`)
      this.logger.error(error)
    }
  }

  private async _updateCarpoolingLogs(carpoolingGroupId: number, date: string) {
    const queryRunner = this.typeOrmService.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const carpoolingGroupRepository = queryRunner.manager.getRepository(
        CarpoolingGroupEntity,
      )
      const carpoolingLogRepository =
        queryRunner.manager.getRepository(CarpoolingLogEntity)
      const dayOffRequestRepository =
        queryRunner.manager.getRepository(DayOffRequestEntity)

      const carpoolingGroup = await carpoolingGroupRepository.findOne({
        where: {
          id: carpoolingGroupId,
        },
        relations: {
          carpoolers: true,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      const { carpoolers } = carpoolingGroup
      const carpoolerIds = carpoolers.map((carpooler) => carpooler.id)

      const [carpoolingFee, dayOffRequests] = await Promise.all([
        this._calculateCarpoolingFee(carpoolingGroupId),

        dayOffRequestRepository.find({
          where: {
            userId: In(carpoolerIds),
            carpoolingGroupId,
            date,
          },
        }),
      ])

      const numberOfCarpoolers = carpoolerIds.length

      const homeToWorkCarpoolerCount =
        numberOfCarpoolers -
        dayOffRequests.filter(
          (dayOffRequest) =>
            dayOffRequest.directionType === DirectionType.HOME_TO_WORK,
        ).length

      const workToHomeCarpoolerCount =
        numberOfCarpoolers -
        dayOffRequests.filter(
          (dayOffRequest) =>
            dayOffRequest.directionType === DirectionType.WORK_TO_HOME,
        ).length

      const homeToWorkCarpoolingFeePerUser = Math.round(
        carpoolingFee / homeToWorkCarpoolerCount,
      )

      const workToHomeCarpoolingFeePerUser = Math.round(
        carpoolingFee / workToHomeCarpoolerCount,
      )

      const isDriverOffHomeToWork = !!dayOffRequests.find(
        (request) =>
          request.userId === carpoolingGroup.driverUserId &&
          request.directionType === DirectionType.HOME_TO_WORK,
      )

      const isDriverOffWorkToHome = !!dayOffRequests.find(
        (request) =>
          request.userId === carpoolingGroup.driverUserId &&
          request.directionType === DirectionType.WORK_TO_HOME,
      )

      const createCarpoolingLogsPromises = carpoolerIds.reduce(
        (promises, carpoolerId) => {
          const isOffHomeToWork = !!dayOffRequests.find(
            (request) =>
              request.userId === carpoolerId &&
              request.directionType === DirectionType.HOME_TO_WORK,
          )

          const isOffWorkToHome = !!dayOffRequests.find(
            (request) =>
              request.userId === carpoolerId &&
              request.directionType === DirectionType.WORK_TO_HOME,
          )

          const isAbsentHomeToWork = isDriverOffHomeToWork || isOffHomeToWork
          const isAbsentWorkToHome = isDriverOffWorkToHome || isOffWorkToHome

          const homeToWorkCarpoolingFee = isAbsentHomeToWork
            ? 0
            : homeToWorkCarpoolingFeePerUser
          const workToHomeCarpoolingFee = isAbsentWorkToHome
            ? 0
            : workToHomeCarpoolingFeePerUser

          return [
            ...promises,

            carpoolingLogRepository.insert([
              {
                userId: carpoolerId,
                carpoolingGroupId,
                date,
                directionType: DirectionType.HOME_TO_WORK,
                carpoolingFee: homeToWorkCarpoolingFee,
                isAbsent: isAbsentHomeToWork,
              },
              {
                userId: carpoolerId,
                carpoolingGroupId,
                date,
                directionType: DirectionType.WORK_TO_HOME,
                carpoolingFee: workToHomeCarpoolingFee,
                isAbsent: isAbsentWorkToHome,
              },
            ]),
          ]
        },
        [],
      )

      await Promise.all([
        ...createCarpoolingLogsPromises,

        dayOffRequestRepository.update(
          {
            userId: In(carpoolerIds),
            carpoolingGroupId,
            date,
          },
          {
            isProcessed: true,
          },
        ),
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

  private async _calculateCarpoolingFee(
    carpoolingGroupId: number,
  ): Promise<number> {
    const carpoolingGroup = await this.carpoolingGroupService.findOne(
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

    const {
      driverUser: {
        driver: {
          vehicleForCarpooling: { fuelConsumptionPer100kms, fuelType },
        },
        addresses,
      },
    } = carpoolingGroup

    const fuelPrice = this.carpoolingGroupService.getCurrentFuelPrice(fuelType)
    const carpoolingDistanceInKms = this.carpoolingGroupService.getDistance(
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
      rawPricePerMoveTurn * (carpoolingFeeRateInPercentage / 100)

    return pricePerMoveTurn
  }
}
