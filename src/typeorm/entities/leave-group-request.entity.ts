import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { CarpoolingGroupEntity } from '.'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'leave_group_requests' })
@Index(['date', 'isProcessed'])
export class LeaveGroupRequestEntity extends BaseEntity {
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

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean
}
