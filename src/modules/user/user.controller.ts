import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  LoggerService,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { Auth } from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { UpdateUserDto, UpdateUserPasswordDto } from './dto/update-user.dto'
import { UserService } from './user.service'

@Auth()
@Controller('users')
export class UserController implements BaseController<UserEntity> {
  constructor(
    private readonly usersService: UserService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  getAll(): Promise<UserEntity[]> {
    throw new Error('Method not implemented.')
  }
  search(searchDto: SearchDto): Promise<SearchResult<UserEntity>> {
    throw new Error('Method not implemented.')
  }
  create(createDto: Record<string, any>): Promise<UserEntity> {
    throw new Error('Method not implemented.')
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

  @Patch(':id')
  updateOneById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
    @UserFromRequest() user: UserEntity,
  ): Promise<UserEntity> {
    const { id: vId, role } = user

    if (vId !== id && role !== Role.ADMIN) {
      throw new ForbiddenException(
        `You don't have permission to update this user!`,
      )
    }

    return this.usersService.updateUser(id, updateDto)
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
