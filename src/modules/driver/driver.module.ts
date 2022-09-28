import { Module } from '@nestjs/common'
import { CarpoolingGroupModule } from '../carpooling-group/carpooling-group.module'
import { VehicleModule } from '../vehicle/vehicle.module'
import { DriverController } from './driver.controller'
import { DriverService } from './driver.service'

@Module({
  imports: [VehicleModule, CarpoolingGroupModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
