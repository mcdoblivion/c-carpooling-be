import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { DirectionType } from '../enums'
import { BaseEntity } from './base.entity'
import { CarpoolingGroupEntity } from './carpooling-group.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'day_off_requests' })
@Index(['userId', 'carpoolingGroupId', 'date', 'directionType'], {
  unique: true,
})
export class DayOffRequestEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.dayOffRequests, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @ManyToOne(
    () => CarpoolingGroupEntity,
    (group: CarpoolingGroupEntity) => group.dayOffRequests,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'carpoolingGroupId' })
  carpoolingGroup: CarpoolingGroupEntity

  @Column()
  carpoolingGroupId: number

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'enum', enum: DirectionType })
  directionType: DirectionType

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean
}
