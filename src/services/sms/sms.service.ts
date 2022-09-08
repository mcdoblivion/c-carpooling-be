import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Twilio } from 'twilio'
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message'

@Injectable()
export class SmsService {
  private readonly appName: string

  private readonly senderPhoneNumber: string
  private readonly client: Twilio

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    const accountSid = config.get<string>('TWILIO_ACCOUNT_SID')
    const authToken = config.get<string>('TWILIO_AUTH_TOKEN')

    this.client = new Twilio(accountSid, authToken)

    this.senderPhoneNumber = this.config.get<string>(
      'TWILIO_SENDER_PHONE_NUMBER',
    )

    this.appName = config.get<string>('APP_NAME')
  }

  async sendMessage(messageOptions: MessageListInstanceCreateOptions) {
    try {
      await this.client.messages.create(messageOptions)
    } catch (error) {
      this.logger.error(`Error when sending SMS to ${messageOptions.to}`, error)
      throw error
    }
  }

  generateOtpMessageOptions(
    toPhoneNumber: string,
    otp: string,
  ): MessageListInstanceCreateOptions {
    return {
      from: this.senderPhoneNumber,
      to: toPhoneNumber,
      body: `Your OTP for ${this.appName} is ${otp}`,
    }
  }
}
