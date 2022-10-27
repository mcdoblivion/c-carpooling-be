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
import { DayOffRequestEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { DayOffRequestService } from './day-off-request.service'
import { CreateDayOffRequestDto } from './dto/create-day-off-request.dto'
import { UpdateDayOffRequestDto } from './dto/update-day-off-request.dto'

@ApiTags('Day Off Request')
@Controller('day-off-requests')
export class DayOffRequestController
  implements BaseController<DayOffRequestEntity>
{
  constructor(private readonly dayOffRequestService: DayOffRequestService) {}

  @Auth()
  @Get()
  search(
    @Query() searchDto: SearchDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<SearchResult<DayOffRequestEntity>> {
    const role = user.role

    if (role === Role.NORMAL_USER) {
      searchDto.filters = { userId: user.id }
    } else if (role !== Role.ADMIN) {
      throw new ForbiddenException()
    }

    return this.dayOffRequestService.searchDayOffRequest(searchDto)
  }

  @Auth(Role.NORMAL_USER)
  @Post()
  create(
    @Body() createDto: CreateDayOffRequestDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<DayOffRequestEntity> {
    return this.dayOffRequestService.createDayOffRequest(createDto, user.id)
  }

  @Auth(Role.NORMAL_USER)
  @Put(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDayOffRequestDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<DayOffRequestEntity> {
    return this.dayOffRequestService.updateDayOffRequest(id, updateDto, user.id)
  }

  @Auth(Role.NORMAL_USER)
  @Delete(':id')
  deleteOneById(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user?: UserEntity,
  ) {
    return this.dayOffRequestService.deleteDayOffRequest(id, user.id)
  }
}
