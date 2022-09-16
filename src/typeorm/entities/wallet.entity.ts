import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { UserEntity, WalletTransactionEntity } from '.'
import { BaseEntity } from './base.entity'

@Entity({ name: 'wallets' })
export class WalletEntity extends BaseEntity {
  @OneToOne(() => UserEntity, (user: UserEntity) => user.wallet, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column()
  currentBalance: number

  @Column()
  lifetimeBalance: number

  @OneToMany(
    () => WalletTransactionEntity,
    (transaction: WalletTransactionEntity) => transaction.wallet,
  )
  transactions: WalletTransactionEntity[]
}
