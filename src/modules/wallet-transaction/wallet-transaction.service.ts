import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { WalletEntity, WalletTransactionEntity } from 'src/typeorm/entities'
import { WalletActionType } from 'src/typeorm/enums'
import { WalletTransactionStatus } from 'src/typeorm/enums/wallet-transaction-status'
import { TypeOrmService } from 'src/typeorm/typeorm.service'
import { BaseService } from '../base/base.service'

@Injectable()
export class WalletTransactionService extends BaseService<WalletTransactionEntity> {
  constructor(private readonly typeOrmService: TypeOrmService) {
    super(typeOrmService.getRepository(WalletTransactionEntity))
  }

  async completeWalletTransaction(walletTransactionId: number) {
    const queryRunner = this.typeOrmService.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const walletTransactionRepository = queryRunner.manager.getRepository(
        WalletTransactionEntity,
      )
      const walletRepository = queryRunner.manager.getRepository(WalletEntity)

      const existingTransaction = await walletTransactionRepository.findOne({
        where: {
          id: walletTransactionId,
        },
        lock: {
          mode: 'optimistic',
          version: 0,
        },
      })

      if (!existingTransaction) {
        throw new NotFoundException(
          `Wallet transaction ${walletTransactionId} does not exist!`,
        )
      }

      if (existingTransaction.status !== WalletTransactionStatus.PENDING) {
        throw new BadRequestException(
          'Wallet transaction has already been processed!',
        )
      }

      existingTransaction.status = WalletTransactionStatus.COMPLETED
      await walletTransactionRepository.save(existingTransaction)

      const { walletId, actionType, value } = existingTransaction

      if (actionType === WalletActionType.TOP_UP) {
        await Promise.all([
          walletRepository.increment(
            {
              id: walletId,
            },
            'currentBalance',
            value,
          ),

          walletRepository.increment(
            {
              id: walletId,
            },
            'lifetimeBalance',
            value,
          ),
        ])
      }

      await queryRunner.commitTransaction()
      return 'Wallet transaction has been completed successfully!'
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      queryRunner.release()
    }
  }

  cancelWalletTransaction(walletTransactionId: number) {
    return this.update(walletTransactionId, {
      status: WalletTransactionStatus.FAILED,
    })
  }
}
