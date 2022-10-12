import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CarpoolingGroupService } from './carpooling-group.service'
import { CreateCarpoolingGroupDto } from './dto/create-carpooling-group.dto'

@Auth(Role.NORMAL_USER)
@ApiTags('Carpooling Group')
@Controller('carpooling-groups')
export class CarpoolingGroupController
  implements BaseController<CarpoolingGroupEntity>
{
  constructor(
    private readonly carpoolingGroupService: CarpoolingGroupService,
  ) {}

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
}
