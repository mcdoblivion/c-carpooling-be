import { Module } from '@nestjs/common'
import { VehicleModule } from '../vehicle/vehicle.module'
import { DriverController } from './driver.controller'
import { DriverService } from './driver.service'

@Module({
  imports: [VehicleModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
