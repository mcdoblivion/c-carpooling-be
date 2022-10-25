import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { DayOffRequestEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { DayOffRequestService } from './day-off-request.service'
import { CreateDayOffRequestDto } from './dto/create-day-off-request.dto'

@ApiTags('Day Off Request')
@Controller('day-off-requests')
export class DayOffRequestController
  implements BaseController<DayOffRequestEntity>
{
  constructor(private readonly dayOffRequestService: DayOffRequestService) {}

  @Auth(Role.NORMAL_USER)
  @Post()
  create(
    @Body() createDto: CreateDayOffRequestDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<DayOffRequestEntity> {
    return this.dayOffRequestService.createDayOffRequest(createDto, user.id)
  }
}
