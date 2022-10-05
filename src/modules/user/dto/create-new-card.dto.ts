import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsPositive,
} from 'class-validator'

export class CreateNewCardDto {
  @IsNumberString()
  @IsNotEmpty()
  cardNumber: string

  @IsIn(Array.from({ length: 12 }, (_, i) => i + 1))
  expiredMonth: number

  @IsInt()
  @IsPositive()
  expiredYear: number

  @IsInt()
  @IsPositive()
  cvc: number
}
