import { Module } from '@nestjs/common'
import { CarpoolingPaymentModule } from '../carpooling-payment/carpooling-payment.module'
import { UserModule } from '../user/user.module'
import { CarpoolingGroupController } from './carpooling-group.controller'
import { CarpoolingGroupService } from './carpooling-group.service'

@Module({
  imports: [UserModule, CarpoolingPaymentModule],
  controllers: [CarpoolingGroupController],
  providers: [CarpoolingGroupService],
  exports: [CarpoolingGroupService],
})
export class CarpoolingGroupModule {}
