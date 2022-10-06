import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

export class CreateNewPasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  otp?: string

  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string

  @IsString()
  @Length(8, 50)
  newPassword: string
}
