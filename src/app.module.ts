import {
  CacheModule,
  Inject,
  LoggerService,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
  WINSTON_MODULE_NEST_PROVIDER,
} from 'nest-winston'
import * as winston from 'winston'
import { AppController } from './app.controller'
import { HttpLoggerMiddleware } from './helpers/http-logger.middleware'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { S3Module } from './services/aws/s3.module'
import { MailModule } from './services/mail/mail.module'
import { SmsModule } from './services/sms/sms.module'
import { TypeOrmModule } from './typeorm/typeorm.module'
import { TypeOrmService } from './typeorm/typeorm.service'
import { DriverModule } from './modules/driver/driver.module'
import { VehicleModule } from './modules/vehicle/vehicle.module'

const config = new ConfigService()

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike(
                config.get<string>('APP_NAME'),
                {
                  prettyPrint: true,
                },
              ),
            ),
          }),
          // other transports...
        ],
        // other options
      }),
      inject: [],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    TypeOrmModule,
    S3Module,
    MailModule,
    SmsModule,
    AuthModule,
    UserModule,
    DriverModule,
    VehicleModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  constructor(
    private readonly typeOrmService: TypeOrmService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.typeOrmService
      .initialize()
      .then(async () => {
        this.logger.log('Connected to database!')
      })
      .catch((error) => {
        this.logger.error(error)
        throw new Error(`Could not connect to database: ${error.message}`)
      })
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*')
  }
}
