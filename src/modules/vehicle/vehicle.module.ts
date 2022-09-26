import { Module } from '@nestjs/common'
import { VehicleService } from './vehicle.service'

@Module({
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
