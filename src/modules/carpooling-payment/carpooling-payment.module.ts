import { Module } from '@nestjs/common'
import { CarpoolingPaymentService } from './carpooling-payment.service'

@Module({
  providers: [CarpoolingPaymentService],
  exports: [CarpoolingPaymentService],
})
export class CarpoolingPaymentModule {}
