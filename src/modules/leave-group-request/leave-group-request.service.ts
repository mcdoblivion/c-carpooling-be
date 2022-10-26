import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { LeaveGroupRequestEntity } from 'src/typeorm/entities'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { DeleteResult } from 'typeorm'
import { BaseService } from '../base/base.service'
import { UserService } from '../user/user.service'
import { CreateLeaveGroupRequestDto } from './dto/create-leave-group-request.dto'
import { UpdateLeaveGroupRequestDto } from './dto/update-leave-group-request.dto'
Dayjs.extend(utc)

@Injectable()
export class LeaveGroupRequestService extends BaseService<LeaveGroupRequestEntity> {
  private readonly minimumDaysToLeaveGroup: number

  constructor(
    private readonly config: ConfigService,
    private readonly typeOrmService: TypeOrmService,
    private readonly userService: UserService,
  ) {
    super(typeOrmService.getRepository(LeaveGroupRequestEntity))
    this.minimumDaysToLeaveGroup = +config.get<number>(
      'MINIMUM_DAYS_TO_LEAVE_GROUP',
    )
  }

  async getListRequests({
    page,
    limit,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<LeaveGroupRequestEntity>> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.carpoolingGroup', 'carpoolingGroup')
      .leftJoin('request.user', 'user')
      .leftJoin('user.userProfile', 'userProfile')
      .addSelect(['user.id', 'userProfile.firstName', 'userProfile.lastName'])
      .where('request.isProcessed = :isProcessed', { isProcessed: false })

    sort = sort.split('.').length > 1 ? sort : `request.${sort}`

    queryBuilder
      .orderBy(sort, order)
      .skip((page - 1) * limit)
      .take(limit)

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult(
      records,
      page,
      limit,
      null,
      null,
      sort,
      order,
      total,
    )
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

    if (!this._isValidDateToLeaveCarpoolingGroup(date)) {
      throw new BadRequestException(
        `The minimum waiting time before leaving the group is ${this.minimumDaysToLeaveGroup} days!`,
      )
    }

    return this.create({ userId, carpoolingGroupId, date })
  }

  async updateLeaveGroupRequest(
    id: number,
    { date }: UpdateLeaveGroupRequestDto,
    userId: number,
  ): Promise<LeaveGroupRequestEntity> {
    const existingRequest = await this.findOne({
      id,
      userId,
      isProcessed: false,
    })

    if (!existingRequest) {
      throw new NotFoundException(
        `The request with ID ${id} does not exist or has already been processed!`,
      )
    }

    const { createdAt } = existingRequest
    if (!this._isValidDateToLeaveCarpoolingGroup(date, createdAt)) {
      throw new BadRequestException(
        `The minimum waiting time before leaving the group is ${this.minimumDaysToLeaveGroup} days!`,
      )
    }

    return this.update(id, { date })
  }

  async deleteLeaveGroupRequest(
    id: number,
    userId: number,
  ): Promise<DeleteResult> {
    const existingRequest = await this.findOne({
      id,
      userId,
      isProcessed: false,
    })

    if (!existingRequest) {
      throw new NotFoundException(
        `The request with ID ${id} does not exist or has already been processed!`,
      )
    }

    return this.delete(id)
  }

  private _isValidDateToLeaveCarpoolingGroup(
    date: string,
    requestCreatedAt = new Date(),
  ): boolean {
    const dayjsDate = Dayjs.utc(date).startOf('day')

    return Dayjs(requestCreatedAt)
      .startOf('day')
      .add(this.minimumDaysToLeaveGroup, 'days')
      .isBefore(dayjsDate)
  }
}
