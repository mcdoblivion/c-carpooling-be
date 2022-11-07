import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { DayjsWeekDay } from 'src/constants/week-day'
import { formatSearchResult } from 'src/helpers/format-search-result'
import { SearchDto } from 'src/helpers/search.dto'
import { DayOffRequestEntity } from 'src/typeorm/entities'
import { DirectionType } from 'src/typeorm/enums'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { SearchResult } from 'src/types'
import { Not } from 'typeorm'
import { BaseService } from '../base/base.service'
import { UserService } from '../user/user.service'
import { CreateDayOffRequestDto } from './dto/create-day-off-request.dto'
import { UpdateDayOffRequestDto } from './dto/update-day-off-request.dto'
Dayjs.extend(utc)

@Injectable()
export class DayOffRequestService extends BaseService<DayOffRequestEntity> {
  private readonly MAXIMUM_DAYS_OFF_IN_MONTH: number

  constructor(
    private readonly config: ConfigService,
    private readonly typeOrmService: TypeOrmService,
    private readonly userService: UserService,
  ) {
    super(typeOrmService.getRepository(DayOffRequestEntity))
    this.MAXIMUM_DAYS_OFF_IN_MONTH = +config.get<number>(
      'MAXIMUM_DAYS_OFF_IN_MONTH',
    )
  }

  async searchDayOffRequest({
    page,
    limit,
    filters,
    sort,
    order,
  }: SearchDto): Promise<SearchResult<DayOffRequestEntity>> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.carpoolingGroup', 'carpoolingGroup')
      .leftJoin('request.user', 'user')
      .leftJoin('user.userProfile', 'userProfile')
      .addSelect(['user.id', 'userProfile.firstName', 'userProfile.lastName'])
      .where('request.isProcessed = :isProcessed', { isProcessed: false })

    const { userId, carpoolingGroupId, directionType } = filters as {
      userId: number
      carpoolingGroupId: number
      directionType: DirectionType
    }

    if (userId) {
      queryBuilder.andWhere('request.userId = :userId', { userId })
    }

    if (carpoolingGroupId) {
      queryBuilder.andWhere('request.carpoolingGroupId = :carpoolingGroupId', {
        carpoolingGroupId,
      })
    }

    if (directionType) {
      queryBuilder.andWhere('request.directionType = :directionType', {
        directionType,
      })
    }

    sort = sort.split('.').length > 1 ? sort : `request.${sort}`

    queryBuilder
      .orderBy(sort, order)
      .skip((page - 1) * limit)
      .take(limit)

    const [records, total] = await queryBuilder.getManyAndCount()

    return formatSearchResult({
      records,
      page,
      limit,
      search: null,
      filters,
      sort,
      order,
      total,
    })
  }

  async createDayOffRequest(
    { carpoolingGroupId, date, directionType }: CreateDayOffRequestDto,
    userId: number,
  ): Promise<DayOffRequestEntity> {
    if (!this._isValidDayOffDate(date)) {
      throw new BadRequestException(
        'The day off date must be a business day (Monday to Friday) and later than today!',
      )
    }

    const existingUser = await this.userService.findById(userId)

    if (existingUser?.carpoolingGroupId !== carpoolingGroupId) {
      throw new BadRequestException('You are not in this carpooling group!')
    }

    const existingRequest = await this.findOne({
      userId,
      carpoolingGroupId,
      date,
      directionType,
    })

    if (existingRequest) {
      throw new BadRequestException(
        `There is already a request on ${date} with direction: ${directionType}`,
      )
    }

    const month = Dayjs(date).month() + 1

    const totalRequestsInMonth = await this.getRepository()
      .createQueryBuilder('request')
      .where('request.userId = :userId', { userId })
      .andWhere('EXTRACT(MONTH FROM request.date) = :month', { month })
      .getCount()

    if (totalRequestsInMonth >= this.MAXIMUM_DAYS_OFF_IN_MONTH) {
      throw new BadRequestException(
        `You are not allowed to create more than ${this.MAXIMUM_DAYS_OFF_IN_MONTH} days off requests per month!`,
      )
    }

    return this.create({ userId, carpoolingGroupId, date, directionType })
  }

  async updateDayOffRequest(
    id: number,
    { date, directionType }: UpdateDayOffRequestDto,
    userId: number,
  ): Promise<DayOffRequestEntity> {
    if (!this._isValidDayOffDate(date)) {
      throw new BadRequestException(
        'The day off date must be a business day (Monday to Friday) and later than today!',
      )
    }

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

    const duplicatedRequest = await this.findOne({
      id: Not(id),
      userId,
      date,
      directionType,
      isProcessed: false,
    })

    if (duplicatedRequest) {
      throw new BadRequestException(
        `There is an existing request on ${date} with direction: ${directionType}`,
      )
    }

    const month = Dayjs(date).month() + 1

    const totalRequestsInMonth = await this.getRepository()
      .createQueryBuilder('request')
      .where('request.id != :id', { id })
      .andWhere('request.userId = :userId', { userId })
      .andWhere('EXTRACT(MONTH FROM request.date) = :month', { month })
      .getCount()

    if (totalRequestsInMonth >= this.MAXIMUM_DAYS_OFF_IN_MONTH) {
      throw new BadRequestException(
        `You are not allowed to create more than ${this.MAXIMUM_DAYS_OFF_IN_MONTH} days off requests per month!`,
      )
    }

    return this.update(id, { date, directionType })
  }

  async deleteDayOffRequest(id: number, userId: number) {
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

  private _isValidDayOffDate(date: string) {
    const dayjsDate = Dayjs.utc(date).startOf('day')

    return (
      Dayjs().startOf('day').isBefore(dayjsDate) &&
      dayjsDate.day() !== DayjsWeekDay.SATURDAY &&
      dayjsDate.day() !== DayjsWeekDay.SUNDAY
    )
  }
}
