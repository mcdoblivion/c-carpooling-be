import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  LoggerService,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { UserFromRequest } from 'src/helpers/get-user-from-request.decorator'
import { SearchDto } from 'src/helpers/search.dto'
import { UserEntity } from 'src/typeorm/entities'
import { Role } from 'src/typeorm/enums'
import { SearchResult } from 'src/types'
import { CreateAddressDto } from '../address/dto/create-address.dto'
import {
  Auth,
  AuthWithoutCompletedProfile,
  Public,
} from '../auth/decorators/auth.decorator'
import { BaseController } from '../base/base.controller'
import { CreateNewCardDto } from './dto/create-new-card.dto'
import { CreateNewPasswordDto } from './dto/create-new-password.dto'
import { TopUpToWalletDto } from './dto/top-up-to-wallet.dto'
import {
  UpdateUser2FAMethodDto,
  UpdateUserActivationStatusDto,
  UpdateUserDto,
  UpdateUserFirstTimeDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto'
import { UserService } from './user.service'

@ApiTags('Users')
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
  search(@Query() searchDto: SearchDto): Promise<SearchResult<UserEntity>> {
    return this.usersService.searchUsers(searchDto)
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

  @Public()
  @Post('password')
  @HttpCode(HttpStatus.OK)
  createNewPassword(@Body() createNewPasswordDto: CreateNewPasswordDto) {
    return this.usersService.createNewPassword(createNewPasswordDto)
  }

  @Put(':id')
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

  @AuthWithoutCompletedProfile()
  @Post(':id/profile')
  createProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserFirstTimeDto: UpdateUserFirstTimeDto,
  ): Promise<UserEntity> {
    return this.usersService.createProfile(id, updateUserFirstTimeDto)
  }

  @Put(':id/password')
  updateUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    return this.usersService.updateUserPassword(id, updateUserPasswordDto)
  }

  @Put(':id/2FA')
  updateUser2FAMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUser2FAMethodDto: UpdateUser2FAMethodDto,
  ) {
    return this.usersService.updateUser2FAMethod(id, updateUser2FAMethodDto)
  }

  @Auth(Role.ADMIN)
  @Put(':id/activation')
  updateUserActivationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserActivationStatusDto: UpdateUserActivationStatusDto,
  ) {
    return this.usersService.updateUserActivationStatus(
      id,
      updateUserActivationStatusDto,
    )
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  deleteOneById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id)
  }

  // Payment
  @Auth(Role.NORMAL_USER)
  @Post(':id/cards')
  addNewCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() createNewCardDto: CreateNewCardDto,
    @UserFromRequest() user: UserEntity,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException('You are only allowed to add your own card!')
    }

    return this.usersService.addNewCard(id, createNewCardDto)
  }

  @Auth(Role.NORMAL_USER)
  @Get(':id/cards')
  getCardList(
    @Param('id', ParseIntPipe) id: number,
    @UserFromRequest() user: UserEntity,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException(
        'You are only allowed to get your own cards!',
      )
    }

    return this.usersService.getCardList(id)
  }

  @Auth(Role.NORMAL_USER)
  @Delete(':id/cards/:cardId')
  async deleteCard(
    @Param('id', ParseIntPipe) id: number,
    @Param('cardId', ParseIntPipe) cardId: number,
    @UserFromRequest() user: UserEntity,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException(
        'You are only allowed to delete your own card!',
      )
    }

    return this.usersService.deleteCard(id, cardId)
  }

  @Auth(Role.NORMAL_USER)
  @Post(':id/top-up')
  @HttpCode(HttpStatus.OK)
  topUpToWallet(
    @Param('id', ParseIntPipe) id: number,
    @Body() topUpToWalletDto: TopUpToWalletDto,
    @UserFromRequest() user: UserEntity,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException(
        'You are only allowed to top up to your own card!',
      )
    }

    return this.usersService.topUpToWallet(id, topUpToWalletDto)
  }

  // Carpooling
  @Auth(Role.NORMAL_USER)
  @Post(':id/addresses')
  addAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() createAddressDto: CreateAddressDto,
    @UserFromRequest() user: UserEntity,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException(
        'You are only allowed to add your own address!',
      )
    }

    return this.usersService.addAddress({
      ...createAddressDto,
      userId: id,
    })
  }
}
