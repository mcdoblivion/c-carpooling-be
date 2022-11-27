import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator'
import { TwoFAMethod } from 'src/typeorm/enums'
import { CreateUserProfileDto } from './create-user-profile.dto'
import { UpdateUserProfileDto } from './update-user-profile.dto'

export class UpdateUserFirstTimeDto {
  @IsString()
  @Length(5, 20)
  @IsOptional()
  username?: string

  @IsPhoneNumber('VI')
  phoneNumber: string

  @IsEnum(TwoFAMethod)
  @IsOptional()
  '2FAMethod': TwoFAMethod

  @ValidateNested()
  @Type(() => CreateUserProfileDto)
  userProfile: CreateUserProfileDto
}

export class UpdateUserDto {
  @IsString()
  @Length(5, 20)
  @IsOptional()
  username: string

  @IsPhoneNumber('VI')
  @IsOptional()
  phoneNumber: string

  @IsEnum(TwoFAMethod)
  @IsOptional()
  '2FAMethod': TwoFAMethod

  @ValidateNested()
  @Type(() => UpdateUserProfileDto)
  @IsOptional()
  userProfile: UpdateUserProfileDto
}

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @IsString()
  @Length(8, 50)
  newPassword: string
}

export class UpdateUser2FAMethodDto {
  @IsEnum(TwoFAMethod)
  twoFAMethod: TwoFAMethod

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  otp?: string
}

export class UpdateUserActivationStatusDto {
  @IsBoolean()
  isActive: boolean
}
