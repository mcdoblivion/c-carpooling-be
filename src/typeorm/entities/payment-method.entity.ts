import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UserEntity } from '.'
import { BaseEntity } from './base.entity'

@Entity({ name: 'payment_methods' })
export class PaymentMethodEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.paymentMethods, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column()
  lastFourDigits: string

  @Column()
  cardType: string

  @Column()
  stripePaymentMethodID: string
}
