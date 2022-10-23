import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import * as entities from './entities'
import * as subscribers from './subscribers'

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
      ssl: { rejectUnauthorized: false },
      // timezone: '+08:00', // default database timezone is SGT
      subscribers,
      entities,
      logging: config.get<string>('DB_LOGGING') === 'true',
      cache: {
        duration: 30000, // 30s
      },
    })
  }
}
