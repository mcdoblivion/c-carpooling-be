import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import * as argon from 'argon2'
import { UserEntity } from 'src/typeorm/entities'
import { BaseService } from '../base/base.service'
import { UpdateUserDto, UpdateUserPasswordDto } from './dto/update-user.dto'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository)
  }

  async getUserDetails(id: number): Promise<UserEntity> {
    const user = await this.findById(id)

    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    return user
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.update(id, updateUserDto)
  }

  async updateUserPassword(
    id: number,
    { currentPassword, newPassword }: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    const existingUser = await this.findOne(
      {
        id,
      },
      {
        select: {
          password: true,
        },
      },
    )

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    const { password: hashPassword } = existingUser
    if (!(await argon.verify(hashPassword, currentPassword))) {
      throw new UnauthorizedException(`Password is incorrect!`)
    }

    const newHashPassword = await argon.hash(newPassword)

    return this.update(id, { password: newHashPassword })
  }
}
