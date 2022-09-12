import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'
import { MailgunService } from './mailgun.service'
import { NodemailerService } from './nodemailer.service'
const config = new ConfigService()

const AllMailServices = {
  NODEMAILER: NodemailerService,
  MAILGUN: MailgunService,
}

@Global()
@Module({
  providers: [
    {
      provide: MailService,
      useClass:
        AllMailServices[config.get<string>('MAIL_SERVICE')] ||
        NodemailerService,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
