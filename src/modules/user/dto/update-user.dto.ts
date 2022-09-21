import { IsNotEmpty, IsString, Length } from 'class-validator'

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @IsString()
  @Length(8, 50)
  newPassword: string
}
