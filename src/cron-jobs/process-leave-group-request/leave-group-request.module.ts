import { forwardRef, Module } from '@nestjs/common'
import { CronJobModule } from 'src/modules/cron-job/cron-job.module'
import { LeaveGroupRequestModule as TypeOrmLeaveGroupRequestModule } from 'src/modules/leave-group-request/leave-group-request.module'
import { LeaveGroupRequestService } from './leave-group-request.service'

@Module({
  imports: [TypeOrmLeaveGroupRequestModule, forwardRef(() => CronJobModule)],
  providers: [LeaveGroupRequestService],
  exports: [LeaveGroupRequestService],
})
export class LeaveGroupRequestModule {}
