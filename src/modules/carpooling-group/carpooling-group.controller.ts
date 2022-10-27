import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CarpoolingGroupService } from './carpooling-group.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'
import { FindCarpoolingGroupDto } from './dto/find-carpooling-group.dto'

@Auth(Role.NORMAL_USER)
@ApiTags('Carpooling Group')
@Controller('carpooling-groups')
export class CarpoolingGroupController
  implements BaseController<CarpoolingGroupEntity>
{
  constructor(
    private readonly carpoolingGroupService: CarpoolingGroupService,
  ) {}

  @Get()
  findCarpoolingGroup(
    @Query() findCarpoolingGroupDto: FindCarpoolingGroupDto,
    @UserFromRequest() user: UserEntity,
  ) {
    return this.carpoolingGroupService.findCarpoolingGroupDto(
      findCarpoolingGroupDto,
      user.id,
    )
  }

  @Auth()
  @Get(':id')
  getOneById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CarpoolingGroupEntity> {
    return this.carpoolingGroupService.getCarpoolingGroupDetails(id)
  }

  @Post()
  create(
    @Body() createDto: CreateCarpoolingGroupDto,
    @UserFromRequest() createBy?: UserEntity,
  ): Promise<CarpoolingGroupEntity> {
    return this.carpoolingGroupService.createCarpoolingGroup(
      createDto,
      createBy.id,
    )
  }

  @Get(':id/fee')
  async getCarpoolingFee(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user: UserEntity,
  ) {
    const {
      pricePerUserPerMoveTurn,
      priceForCurrentMonth,
      savingCostInPercentage,
    } = await this.carpoolingGroupService.getCarpoolingFee(id)

    this.carpoolingGroupService.updateCarpoolingPayment(
      id,
      user.id,
      priceForCurrentMonth,
    )

    return {
      pricePerUserPerMoveTurn,
      priceForCurrentMonth,
      savingCostInPercentage,
    }
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  joinCarpoolingGroup(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user: UserEntity,
  ) {
    return this.carpoolingGroupService.joinCarpoolingGroup(id, user.id)
  }
}
