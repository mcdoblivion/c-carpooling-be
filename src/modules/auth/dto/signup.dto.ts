import { IsEmail, IsString, Length } from 'class-validator'

export class SignupDto {
  @IsEmail()
  email: string

  @Length(8)
  @IsString()
  password: string
}
