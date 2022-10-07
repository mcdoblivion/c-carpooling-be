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
import { DriverEntity, UserEntity, VehicleEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto'
import { UpdateVehicleDto } from '../vehicle/dto/update-vehicle.dto'
import { DriverService } from './driver.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@ApiTags('Driver')
@Auth()
@Controller('drivers')
export class DriverController implements BaseController<DriverEntity> {
  constructor(private readonly driverService: DriverService) {}

  @Auth(Role.ADMIN)
  @Get()
  search(@Query() searchDto: SearchDto): Promise<SearchResult<DriverEntity>> {
    return this.driverService.searchDrivers(searchDto)
  }

  @Auth(Role.ADMIN)
  @Get('all')
  getAll(): Promise<DriverEntity[]> {
    return this.driverService.findAll({})
  }

  @Auth(Role.NORMAL_USER)
  @Post()
  create(
    @Body() createDto: CreateDriverDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<DriverEntity> {
    return this.driverService.registerToBecomeDriver({
      ...createDto,
      userId: user.id,
    })
  }

  @Auth(Role.ADMIN)
  @Put(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDriverDto,
  ): Promise<DriverEntity> {
    return this.driverService.updateDriver(id, updateDto)
  }

  @Auth(Role.NORMAL_USER)
  @Put(':id/main-vehicle')
  async changeVehicleForCarpooling(
    @Param('id', ParseIntPipe) id: number,
    @Body('vehicleId', ParseIntPipe) vehicleId: number,
    @UserFromRequest() user: UserEntity,
  ) {
    if (!(await this.driverService.isValidDriver(id, user.id))) {
      throw new ForbiddenException(
        'You are only allowed to change your own vehicle!',
      )
    }

    return this.driverService.changeVehicleForCarpooling(id, user.id, vehicleId)
  }

  @Auth(Role.NORMAL_USER)
  @Get(':id/vehicles')
  async getAllVehicles(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user: UserEntity,
  ): Promise<VehicleEntity[]> {
    if (!(await this.driverService.isValidDriver(id, user.id))) {
      throw new ForbiddenException(
        'You are only allowed to get your own vehicles!',
      )
    }

    return this.driverService.getAllVehicles(id)
  }

  @Auth(Role.NORMAL_USER)
  @Post(':id/vehicles')
  async addVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() createVehicleDto: CreateVehicleDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<VehicleEntity> {
    if (!(await this.driverService.isValidDriver(id, user.id))) {
      throw new ForbiddenException(
        'You are only allowed to add your own vehicle!',
      )
    }

    return this.driverService.addVehicle(id, createVehicleDto)
  }

  @Auth(Role.NORMAL_USER)
  @Put(':id/vehicles/:vehicleId')
  async updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<VehicleEntity> {
    if (!(await this.driverService.isValidDriver(id, user.id))) {
      throw new ForbiddenException(
        'You are only allowed to update your own vehicle!',
      )
    }

    return this.driverService.updateVehicle(id, vehicleId, updateVehicleDto)
  }

  @Auth(Role.NORMAL_USER)
  @Delete(':id/vehicles/:vehicleId')
  async deleteVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @UserFromRequest() user: UserEntity,
  ) {
    if (!(await this.driverService.isValidDriver(id, user.id))) {
      throw new ForbiddenException(
        'You are only allowed to delete your own vehicle!',
      )
    }

    return this.driverService.deleteVehicle(id, vehicleId)
  }
}
