import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { CarpoolingGroupController } from './carpooling-group.controller'
import { CarpoolingGroupService } from './carpooling-group.service'

@Module({
  imports: [UserModule],
  controllers: [CarpoolingGroupController],
  providers: [CarpoolingGroupService],
  exports: [CarpoolingGroupService],
})
export class CarpoolingGroupModule {}
