import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  LoggerService,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth, Public } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CreateNewPasswordDto } from './dto/create-new-password.dto'
import { UpdateUserPasswordDto } from './dto/update-user.dto'
import { UserService } from './user.service'

@Auth()
@Controller('users')
export class UserController implements BaseController<UserEntity> {
  constructor(
    private readonly usersService: UserService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Auth(Role.ADMIN)
  @Get()
  search(searchDto: SearchDto): Promise<SearchResult<UserEntity>> {
    throw new Error('Method not implemented.')
  }

  @Auth(Role.ADMIN)
  @Get('all')
  getAll(): Promise<UserEntity[]> {
    return this.usersService.findAll({})
  }

  @Get('me')
  getMe(@UserFromRequest() user: UserEntity): Promise<UserEntity> {
    return this.usersService.getUserDetails(user.id)
  }

  @Auth(Role.ADMIN)
  @Get(':id')
  getOneById(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.usersService.getUserDetails(id)
  }

  create(createDto: Record<string, any>): Promise<UserEntity> {
    throw new Error('Method not implemented.')
  }

  @Public()
  @Post('password')
  @HttpCode(HttpStatus.OK)
  createNewPassword(@Body() createNewPasswordDto: CreateNewPasswordDto) {
    return this.usersService.createNewPassword(createNewPasswordDto)
  }

  @Put(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Record<string, any>,
  ): Promise<UserEntity> {
    throw new Error('Method not implemented.')
  }

  @Put(':id/password')
  updateUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    return this.usersService.updateUserPassword(id, updateUserPasswordDto)
  }

  deleteOneById(id: number): Promise<any> {
    throw new Error('Method not implemented.')
  }

  deleteMany({ IDs }: { IDs: number[] }): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
