import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  avatar?: string

  @IsString()
  @Length(1, 128)
  @IsOptional()
  description?: string

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string
}

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @IsString()
  @Length(8, 50)
  newPassword: string
}
