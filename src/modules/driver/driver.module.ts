import { forwardRef, Module } from '@nestjs/common'
import { CarpoolingGroupModule } from '../carpooling-group/carpooling-group.module'
import { VehicleModule } from '../vehicle/vehicle.module'
import { DriverController } from './driver.controller'
import { DriverService } from './driver.service'

@Module({
  imports: [forwardRef(() => VehicleModule), CarpoolingGroupModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
