import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { LeaveGroupRequestController } from './leave-group-request.controller'
import { LeaveGroupRequestService } from './leave-group-request.service'

@Module({
  imports: [UserModule],
  controllers: [LeaveGroupRequestController],
  providers: [LeaveGroupRequestService],
})
export class LeaveGroupRequestModule {}
