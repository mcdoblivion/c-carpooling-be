import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

export class LoginDto {
  @IsString()
  @Length(5)
  usernameOrEmail: string

  @IsString()
  @Length(8)
  password: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  otp?: string
}
