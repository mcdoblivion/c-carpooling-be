import { forwardRef, Module } from '@nestjs/common'
import { LeaveGroupRequestModule } from 'src/cron-jobs/process-leave-group-request/leave-group-request.module'
import { CronJobController } from './cron-job.controller'
import { CronJobService } from './cron-job.service'

@Module({
  imports: [forwardRef(() => LeaveGroupRequestModule)],
  controllers: [CronJobController],
  providers: [CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
