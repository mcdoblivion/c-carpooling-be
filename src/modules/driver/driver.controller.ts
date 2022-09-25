import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { DriverEntity, UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { DriverService } from './driver.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

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

  @Get(':id')
  getOneById(@Param('id', ParseIntPipe) id: number): Promise<DriverEntity> {
    throw new Error('Method not implemented.')
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

  @Put(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDriverDto,
  ): Promise<DriverEntity> {
    throw new Error('Method not implemented.')
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  deleteOneById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    throw new Error('Method not implemented.')
  }

  deleteMany({ IDs }: { IDs: number[] }): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
