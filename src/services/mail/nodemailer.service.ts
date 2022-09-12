import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { createTransport, SendMailOptions, Transporter } from 'nodemailer'
import { MailService } from './mail.service'

@Injectable()
export class NodemailerService implements MailService {
  private readonly transporter: Transporter
  private readonly appName: string
  private readonly email: string
  private readonly emailPassword: string

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.appName = config.get<string>('APP_NAME')
    this.email = config.get<string>('NODE_MAILER_EMAIL')
    this.emailPassword = config.get<string>('NODEMAILER_MAIL_PASSWORD')

    this.transporter = createTransport({
      pool: true,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.email,
        pass: this.emailPassword,
      },
    })
  }

  async sendEmail(mailOptions: SendMailOptions): Promise<any> {
    try {
      return await this.transporter.sendMail(mailOptions)
    } catch (error) {
      this.logger.error(`Error when sending email to ${mailOptions?.to}`)
      throw error
    }
  }

  generateOtpMailOptions(
    toEmail: string,
    otp: string,
    userFirstName = 'Friend',
  ) {
    return {
      from: `${this.appName} Support ${this.email}`,
      to: toEmail,
      subject: `OTP for ${this.appName}`,
      html: `<p>Dear ${userFirstName},</p>
      <p>Here is your OTP for ${this.appName}:</p>
      <p><strong>${otp}</strong></p>
      <p>Thank you.</p>
      <p>Regards,</p>
      <p>${this.appName} Team</p>`,
    }
  }
}
