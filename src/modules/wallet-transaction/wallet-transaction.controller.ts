import { Controller } from '@nestjs/common'
import { WalletTransactionService } from './wallet-transaction.service'

@Controller('wallet-transactions')
export class WalletTransactionController {
  constructor(
    private readonly walletTransactionService: WalletTransactionService,
  ) {}
}
