import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { AddressType } from '../enums'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'addresses' })
@Index(['userId', 'type'], { unique: true })
export class AddressEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.addresses, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column()
  fullAddress: string

  @Column()
  longitude: string

  @Column()
  latitude: string

  @Column({ type: 'enum', enum: AddressType })
  type: AddressType
}
