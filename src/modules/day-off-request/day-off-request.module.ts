import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { DayOffRequestController } from './day-off-request.controller'
import { DayOffRequestService } from './day-off-request.service'

@Module({
  imports: [UserModule],
  controllers: [DayOffRequestController],
  providers: [DayOffRequestService],
})
export class DayOffRequestModule {}
