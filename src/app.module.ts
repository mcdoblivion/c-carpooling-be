import {
  CacheModule,
  Inject,
  LoggerService,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
  WINSTON_MODULE_NEST_PROVIDER,
} from 'nest-winston'
import * as winston from 'winston'
import { AppController } from './app.controller'
import { LeaveGroupRequestModule as LeaveGroupRequestTask } from './cron-jobs/process-leave-group-request/leave-group-request.module'
import { UpdateCarpoolingLogModule } from './cron-jobs/update-carpooling-log/update-carpooling-log.module'
import { HttpLoggerMiddleware } from './helpers/http-logger.middleware'
import { AddressModule } from './modules/address/address.module'
import { AuthModule } from './modules/auth/auth.module'
import { CarpoolingGroupModule } from './modules/carpooling-group/carpooling-group.module'
import { CarpoolingPaymentModule } from './modules/carpooling-payment/carpooling-payment.module'
import { CronJobModule } from './modules/cron-job/cron-job.module'
import { DayOffRequestModule } from './modules/day-off-request/day-off-request.module'
import { DriverModule } from './modules/driver/driver.module'
import { LeaveGroupRequestModule } from './modules/leave-group-request/leave-group-request.module'
import { PaymentMethodModule } from './modules/payment-method/payment-method.module'
import { UserModule } from './modules/user/user.module'
import { VehicleModule } from './modules/vehicle/vehicle.module'
import { WalletTransactionModule } from './modules/wallet-transaction/wallet-transaction.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { CloudinaryModule } from './services/cloudinary/cloudinary.module'
import { MailModule } from './services/mail/mail.module'
import { SmsModule } from './services/sms/sms.module'
import { StripeModule } from './services/stripe/stripe.module'
import { TypeOrmModule } from './typeorm/typeorm.module'
import { TypeOrmService } from './typeorm/typeorm.service'
import { StripeController } from './webhooks/stripe.controller'
import { CarpoolingLogModule } from './modules/carpooling-log/carpooling-log.module'

const config = new ConfigService()

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LeaveGroupRequestTask,
    UpdateCarpoolingLogModule,
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
    CloudinaryModule,
    MailModule,
    SmsModule,
    StripeModule,
    AuthModule,
    UserModule,
    DriverModule,
    VehicleModule,
    CarpoolingGroupModule,
    PaymentMethodModule,
    WalletModule,
    WalletTransactionModule,
    AddressModule,
    CarpoolingPaymentModule,
    LeaveGroupRequestModule,
    DayOffRequestModule,
    CronJobModule,
    CarpoolingLogModule,
  ],
  controllers: [AppController, StripeController],
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
