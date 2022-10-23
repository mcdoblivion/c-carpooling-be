import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { LeaveGroupRequestEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'
import { UserService } from '../user/user.service'
import { CreateLeaveGroupRequestDto } from './dto/create-leave-group-request.dto'
Dayjs.extend(utc)

@Injectable()
export class LeaveGroupRequestService extends BaseService<LeaveGroupRequestEntity> {
  constructor(
    private readonly config: ConfigService,
    private readonly typeOrmService: TypeOrmService,
    private readonly userService: UserService,
  ) {
    super(typeOrmService.getRepository(LeaveGroupRequestEntity))
  }

  async createLeaveGroupRequest(
    { carpoolingGroupId, date }: CreateLeaveGroupRequestDto,
    userId: number,
  ): Promise<LeaveGroupRequestEntity> {
    const existingUser = await this.userService.findById(userId)

    if (existingUser?.carpoolingGroupId !== carpoolingGroupId) {
      throw new BadRequestException('You are not in this carpooling group!')
    }

    const existingRequest = await this.findOne({
      userId,
      carpoolingGroupId,
      isProcessed: false,
    })

    if (existingRequest) {
      throw new BadRequestException(
        'There is an existing request. Please update this request instead of creating a new one!',
      )
    }

    const minimumDaysToLeaveGroup = +this.config.get<number>(
      'MINIMUM_DAYS_TO_LEAVE_GROUP',
    )

    const dayjsDate = Dayjs.utc(date).startOf('day')

    if (
      Dayjs()
        .startOf('day')
        .add(minimumDaysToLeaveGroup, 'days')
        .isAfter(dayjsDate)
    ) {
      throw new BadRequestException(
        `The minimum waiting time before leaving the group is ${minimumDaysToLeaveGroup} days!`,
      )
    }

    return this.create({ userId, carpoolingGroupId, date })
  }
}
