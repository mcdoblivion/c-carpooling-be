import { forwardRef, Module } from '@nestjs/common'
import { DriverModule } from '../driver/driver.module'
import { VehicleController } from './vehicle.controller'
import { VehicleService } from './vehicle.service'

@Module({
  imports: [forwardRef(() => DriverModule)],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
