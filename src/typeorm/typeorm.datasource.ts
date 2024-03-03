import { ConfigModule, ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import * as entities from './entities'

ConfigModule.forRoot()
const config = new ConfigService()

const dataSource = new DataSource({
  type: 'postgres',
  host: config.get<string>('DB_HOST'),
  port: config.get<number>('DB_PORT'),
  username: config.get<string>('DB_USER'),
  password: config.get<string>('DB_PASSWORD'),
  database: config.get<string>('DB_DATABASE'),
  migrations: ['src/typeorm/migrations/*{.ts,.js}'],
  entities,
})

export default dataSource
