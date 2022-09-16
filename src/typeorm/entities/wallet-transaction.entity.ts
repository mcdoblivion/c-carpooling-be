import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { WalletEntity } from '.'
import { WalletActionType } from '../enums'
import { BaseEntity } from './base.entity'

@Entity({ name: 'wallet_transactions' })
export class WalletTransactionEntity extends BaseEntity {
  @ManyToOne(
    () => WalletEntity,
    (wallet: WalletEntity) => wallet.transactions,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'walletId' })
  wallet: WalletEntity

  @Column()
  walletId: number

  @Column({ type: 'enum', enum: WalletActionType })
  actionType: WalletActionType

  @Column()
  value: number

  @Column({ nullable: true })
  description: string
}
