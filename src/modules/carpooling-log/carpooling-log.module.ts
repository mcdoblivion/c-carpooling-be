import { Module } from '@nestjs/common'
import { CarpoolingLogService } from './carpooling-log.service'
import { CarpoolingLogController } from './carpooling-log.controller'

@Module({
  controllers: [CarpoolingLogController],
  providers: [CarpoolingLogService],
})
export class CarpoolingLogModule {}
