import { IsDateString, IsOptional, IsString, Length } from 'class-validator'

export class CreateUserProfileDto {
  @IsString()
  @Length(1, 20)
  firstName: string

  @IsString()
  @Length(1, 20)
  lastName: string

  @IsString()
  @Length(1, 20)
  ICNumber: string

  @IsDateString()
  dateOfBirth: string

  @IsString()
  @Length(1, 10)
  gender: string

  @IsString()
  @IsOptional()
  avatarURL?: string
}
