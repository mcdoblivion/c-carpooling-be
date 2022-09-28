import { Module } from '@nestjs/common'
import { CarpoolingGroupController } from './carpooling-group.controller'
import { CarpoolingGroupService } from './carpooling-group.service'

@Module({
  controllers: [CarpoolingGroupController],
  providers: [CarpoolingGroupService],
  exports: [CarpoolingGroupService],
})
export class CarpoolingGroupModule {}
