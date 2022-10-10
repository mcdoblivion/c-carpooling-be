import { forwardRef, Module } from '@nestjs/common'
import { S3Module } from 'src/services/aws/s3.module'
import { AddressModule } from '../address/address.module'
import { AuthModule } from '../auth/auth.module'
import { PaymentMethodModule } from '../payment-method/payment-method.module'
import { WalletTransactionModule } from '../wallet-transaction/wallet-transaction.module'
import { WalletModule } from '../wallet/wallet.module'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  imports: [
    S3Module,
    PaymentMethodModule,
    WalletModule,
    WalletTransactionModule,
    AddressModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
