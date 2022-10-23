import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { LeaveGroupRequestEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CreateLeaveGroupRequestDto } from './dto/create-leave-group-request.dto'
import { LeaveGroupRequestService } from './leave-group-request.service'

@Auth()
@ApiTags('Leave Group Request')
@Controller('leave-group-requests')
export class LeaveGroupRequestController
  implements BaseController<LeaveGroupRequestEntity>
{
  constructor(
    private readonly leaveGroupRequestService: LeaveGroupRequestService,
  ) {}

  @Auth(Role.NORMAL_USER)
  @Post()
  create(
    @Body() createDto: CreateLeaveGroupRequestDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<LeaveGroupRequestEntity> {
    return this.leaveGroupRequestService.createLeaveGroupRequest(
      createDto,
      user.id,
    )
  }
}
