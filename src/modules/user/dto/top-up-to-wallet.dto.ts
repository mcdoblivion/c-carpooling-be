import { IsInt, IsPositive } from 'class-validator'

export class TopUpToWalletDto {
  @IsInt()
  @IsPositive()
  paymentMethodId: number

  @IsInt()
  @IsPositive()
  amount: number
}
