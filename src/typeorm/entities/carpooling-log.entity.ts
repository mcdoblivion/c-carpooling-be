import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { CarpoolingGroupEntity } from '.'
import { DirectionType } from '../enums'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'carpooling_logs' })
@Index(['userId', 'carpoolingGroupId', 'date', 'directionType'], {
  unique: true,
})
export class CarpoolingLogEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.carpoolingLogs, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @ManyToOne(
    () => CarpoolingGroupEntity,
    (group: CarpoolingGroupEntity) => group.carpoolingLogs,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'carpoolingGroupId' })
  carpoolingGroup: CarpoolingGroupEntity

  @Column()
  carpoolingGroupId: number

  @Column({ type: 'date' })
  date: Date

  @Column({ type: 'enum', enum: DirectionType })
  directionType: DirectionType

  @Column({ type: 'boolean' })
  isAbsent: boolean

  @Column()
  carpoolingFee: number
}
