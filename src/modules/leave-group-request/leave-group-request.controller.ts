import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { LeaveGroupRequestEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { DeleteResult } from 'typeorm'
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

  @Auth()
  @Get()
  search(
    @Query() searchDto: SearchDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<SearchResult<LeaveGroupRequestEntity>> {
    const role = user.role

    if (role === Role.NORMAL_USER) {
      searchDto.filters = { userId: user.id }
    } else if (role !== Role.ADMIN) {
      throw new ForbiddenException()
    }

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

  @Auth(Role.NORMAL_USER)
  @Delete(':id')
  deleteOneById(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user: UserEntity,
  ): Promise<DeleteResult> {
    return this.leaveGroupRequestService.deleteLeaveGroupRequest(id, user.id)
  }
}
