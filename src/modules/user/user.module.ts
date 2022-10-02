import { forwardRef, Module } from '@nestjs/common'
import { S3Module } from 'src/services/aws/s3.module'
import { AuthModule } from '../auth/auth.module'
import { PaymentMethodModule } from '../payment-method/payment-method.module'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  imports: [S3Module, PaymentMethodModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
