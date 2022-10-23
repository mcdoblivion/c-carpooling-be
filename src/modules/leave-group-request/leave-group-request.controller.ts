import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { LeaveGroupRequestEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CreateLeaveGroupRequestDto } from './dto/create-leave-group-request.dto'
import { UpdateLeaveGroupRequestDto } from './dto/update-leave-group-request.dto'
import { LeaveGroupRequestService } from './leave-group-request.service'

@ApiTags('Leave Group Request')
@Controller('leave-group-requests')
export class LeaveGroupRequestController
  implements BaseController<LeaveGroupRequestEntity>
{
  constructor(
    private readonly leaveGroupRequestService: LeaveGroupRequestService,
  ) {}

  @Auth(Role.ADMIN)
  @Get()
  search(
    @Body() searchDto: SearchDto,
  ): Promise<SearchResult<LeaveGroupRequestEntity>> {
    return this.leaveGroupRequestService.getListRequests(searchDto)
  }

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

  @Auth(Role.NORMAL_USER)
  @Put(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLeaveGroupRequestDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<LeaveGroupRequestEntity> {
    return this.leaveGroupRequestService.updateLeaveGroupRequest(
      id,
      updateDto,
      user.id,
    )
  }
}
