/* eslint-disable @typescript-eslint/no-var-requires */
import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Client from 'mailgun.js/client'
import { MailgunMessageData } from 'mailgun.js/interfaces/Messages'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
// Don't use import here
const formData = require('form-data')
const Mailgun = require('mailgun.js')

const mailgun = new Mailgun(formData)

@Injectable()
export class MailService {
  private readonly appName: string

  private readonly client: Client
  private readonly domain: string
  private readonly fromEmail: string

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.client = mailgun.client({
      username: 'api',
      key: config.get<string>('MAILGUN_API_KEY'),
    })
    this.domain = config.get<string>('MAILGUN_DOMAIN')
    this.fromEmail = config.get<string>('EMAIL')

    this.appName = config.get<string>('APP_NAME')
  }

  async sendEmail(mailOptions: MailgunMessageData) {
    try {
      return await this.client.messages.create(this.domain, mailOptions)
    } catch (error) {
      this.logger.error(`Error when sending email to ${mailOptions?.to}`, error)
      throw error
    }
  }

  generateOtpMailOptions(
    toEmail: string,
    otp: string,
    userFirstName = 'User',
  ): MailgunMessageData {
    return {
      from: `${this.appName} Support ${this.fromEmail}`,
      to: toEmail,
      subject: `OTP for ${this.appName}`,
      html: `<p>Dear ${userFirstName},</p>
      <br/>
      <p>Here is your OTP for ${this.appName}:</p>
      <p><strong>${otp}</strong></p>
      <br/>
      <p>Thank you.</p>
      <p>Regards,</p>
      <p>${this.appName} Team</p>`,
    } as MailgunMessageData
  }
}
