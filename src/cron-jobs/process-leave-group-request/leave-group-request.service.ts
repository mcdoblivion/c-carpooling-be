import { forwardRef, Inject, Injectable, LoggerService } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { CronJobService } from 'src/modules/cron-job/cron-job.service'
import { LeaveGroupRequestService as TypeOrmLeaveGroupRequestService } from 'src/modules/leave-group-request/leave-group-request.service'
import {
  CarpoolingGroupEntity,
  CronJobEntity,
  LeaveGroupRequestEntity,
  UserEntity,
} from 'src/typeorm/entities'
import { CronJobType } from 'src/typeorm/enums/cron-job-type'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { In } from 'typeorm'

@Injectable()
export class LeaveGroupRequestService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly typeOrmService: TypeOrmService,
    @Inject(forwardRef(() => CronJobService))
    private readonly cronJobService: CronJobService,
    private readonly leaveGroupRequestService: TypeOrmLeaveGroupRequestService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'leave-group-requests',
  })
  async processLeaveGroupRequests(cronJobId: number) {
    let cronJob: CronJobEntity
    const date = new Date().toISOString().split('T')[0]

    try {
      if (cronJobId) {
        cronJob = await this.cronJobService.findById(cronJobId)

        if (!cronJob) {
          this.logger.error(`Cron job with ID ${cronJobId} does not exist!`)
          return
        }
      } else {
        cronJob = await this.cronJobService.create({
          name: 'leave-group-requests',
          description: 'Process the requests to leave carpooling group',
          type: CronJobType.LEAVE_GROUP_REQUEST,
          date,
        })
      }

      this.logger.log(
        'Start processing the requests to leave carpooling group...',
      )

      const leaveGroupRequests = await this.leaveGroupRequestService.findAll({
        date,
        isProcessed: false,
      })

      await Promise.all(
        leaveGroupRequests.map((leaveGroupRequest) =>
          this._processLeaveGroupRequest(leaveGroupRequest),
        ),
      )

      cronJob.finishedAt = new Date()

      await this.cronJobService.getRepository().save(cronJob)

      this.logger.log(
        `All requests to leave carpooling group on ${date} have been processed!`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to process the requests to leave carpooling group on ${date}!`,
      )
    }
  }

  private async _processLeaveGroupRequest({
    id,
    userId,
    carpoolingGroupId,
  }: LeaveGroupRequestEntity) {
    const queryRunner = this.typeOrmService.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const leaveGroupRequestRepository = queryRunner.manager.getRepository(
        LeaveGroupRequestEntity,
      )
      const userRepository = queryRunner.manager.getRepository(UserEntity)
      const carpoolingGroupRepository = queryRunner.manager.getRepository(
        CarpoolingGroupEntity,
      )

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

      const { driverUserId, carpoolers } = carpoolingGroup

      if (driverUserId === userId) {
        const carpoolerUserIds = carpoolers.map((carpooler) => carpooler.id)

        await Promise.all([
          userRepository.update(
            {
              id: In(carpoolerUserIds),
            },
            {
              carpoolingGroupId: null,
            },
          ),

          carpoolingGroupRepository.update(
            {
              id: carpoolingGroupId,
            },
            {
              deletedAt: new Date(),
            },
          ),
        ])
      } else {
        await userRepository.update({ id: userId }, { carpoolingGroupId: null })
      }

      await leaveGroupRequestRepository.update(
        {
          id,
        },
        {
          isProcessed: true,
        },
      )

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()

      throw error
    } finally {
      queryRunner.release()
    }
  }
}
