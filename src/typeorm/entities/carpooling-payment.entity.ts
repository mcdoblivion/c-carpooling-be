import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { CarpoolingGroupEntity } from '.'
import { WalletTransactionStatus } from '../enums/wallet-transaction-status'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'carpooling_payments' })
export class CarpoolingPaymentEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.leaveGroupRequests, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @ManyToOne(
    () => CarpoolingGroupEntity,
    (group: CarpoolingGroupEntity) => group.leaveGroupRequests,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'carpoolingGroupId' })
  carpoolingGroup: CarpoolingGroupEntity

  @Column()
  carpoolingGroupId: number

  @Column()
  carpoolingFee: number

  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status: WalletTransactionStatus
}
