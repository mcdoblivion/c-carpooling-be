import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cache } from 'cache-manager'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { S3Service } from 'src/services/aws/s3.service'
import { MailService } from 'src/services/mail/mail.service'
import { SmsService } from 'src/services/sms/sms.service'
import { UserEntity } from 'src/typeorm/entities'
import { BaseService } from '../base/base.service'
import { UpdateUserPasswordDto } from './dto/update-user.dto'
import { UserRepository } from './user.repository'
import * as argon from 'argon2'

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly mailsService: MailService,
    private readonly smsService: SmsService,
  ) {
    super(userRepository)
  }

  async getUserDetails(id: number): Promise<UserEntity> {
    const user = await this.findOne(
      { id },
      {
        relations: {
          carpoolingGroup: true,
          driver: {
            vehicles: true,
          },
          wallet: true,
          paymentMethods: true,
          userProfile: true,
          addresses: true,
        },
      },
    )

    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist!`)
    }

    return user
  }

  async updateUserPassword(
    id: number,
    { currentPassword, newPassword }: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    const existingUser = await this.findOne(
      {
        id,
        deletedAt: null,
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
