import { Module } from '@nestjs/common'
import { PaymentMethodController } from './payment-method.controller'
import { PaymentMethodService } from './payment-method.service'

@Module({
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
