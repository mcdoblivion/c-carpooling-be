import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Cache } from 'cache-manager'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { S3Service } from 'src/services/aws/s3.service'
import { MailService } from 'src/services/mail/mail.service'
import { SmsService } from 'src/services/sms/sms.service'
import { UserEntity } from 'src/typeorm/entities'
import { BaseService } from '../base/base.service'

import { UserRepository } from './user.repository'

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
}
