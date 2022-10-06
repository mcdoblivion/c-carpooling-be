import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SearchDto } from 'src/helpers/search.dto'
import { VehicleEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { VehicleService } from './vehicle.service'

@ApiTags('Vehicle')
@Auth(Role.ADMIN)
@Controller('vehicles')
export class VehicleController implements BaseController<VehicleEntity> {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  search(@Query() searchDto: SearchDto): Promise<SearchResult<VehicleEntity>> {
    return this.vehicleService.searchVehicles(searchDto)
  }
}
