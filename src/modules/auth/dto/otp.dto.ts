import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { TwoFAMethod } from 'src/typeorm/enums'

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  otp: string
}

export class SendOtpDto {
  @IsEnum(TwoFAMethod)
  @IsOptional()
  twoFAMethod: TwoFAMethod = TwoFAMethod.EMAIL

  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string
}
