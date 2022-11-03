import { forwardRef, Module } from '@nestjs/common'
import { CarpoolingGroupModule } from 'src/modules/carpooling-group/carpooling-group.module'
import { CronJobModule } from 'src/modules/cron-job/cron-job.module'
import { UserModule } from 'src/modules/user/user.module'
import { UpdateCarpoolingLogService } from './update-carpooling-log.service'

@Module({
  imports: [forwardRef(() => CronJobModule), CarpoolingGroupModule, UserModule],
  providers: [UpdateCarpoolingLogService],
  exports: [UpdateCarpoolingLogService],
})
export class UpdateCarpoolingLogModule {}
