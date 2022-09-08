import { Global, Module } from '@nestjs/common'
import { TypeOrmService } from './typeorm.service'

@Global()
@Module({
  providers: [TypeOrmService],
  exports: [TypeOrmService],
})
export class TypeOrmModule {}
