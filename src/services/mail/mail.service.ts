export abstract class MailService {
  async sendEmail(mailOptions: object): Promise<any> {
    throw new Error(`This method hasn't been implemented!`)
  }

  generateOtpMailOptions(
    toEmail: string,
    otp: string,
    userFirstName?: string,
  ): object {
    throw new Error(`This method hasn't been implemented!`)
  }
}
