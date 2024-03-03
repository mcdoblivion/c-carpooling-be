import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import * as entities from './entities'

@Injectable()
export class TypeOrmService extends DataSource {
  constructor(private readonly config: ConfigService) {
    super({
      type: 'postgres',
      host: config.get<string>('DB_HOST'),
      port: config.get<number>('DB_PORT'),
      username: config.get<string>('DB_USER'),
      password: config.get<string>('DB_PASSWORD'),
      database: config.get<string>('DB_DATABASE'),
      entities,
      logging: config.get<string>('DB_LOGGING') === 'true',
    })
  }
}
