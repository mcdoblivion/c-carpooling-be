import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { CarpoolingGroupEntity } from '.'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'leave_group_requests' })
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
  date: Date

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean
}
