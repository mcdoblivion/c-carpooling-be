import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { CarpoolingLogEntity, LeaveGroupRequestEntity } from '.'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'carpooling_groups' })
@Index(['groupName', 'driverUserId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class CarpoolingGroupEntity extends BaseEntity {
  @OneToMany(() => UserEntity, (user: UserEntity) => user.carpoolingGroup)
  carpoolers: UserEntity

  @OneToOne(() => UserEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverUserId' })
  driver: UserEntity

  @Column()
  driverUserId: number

  @Column()
  groupName: string

  @Column({ type: 'time with time zone' })
  departureTime: Date

  @Column({ type: 'time with time zone' })
  comebackTime: Date

  @Column()
  delayDurationInMinutes: number

  @OneToMany(
    () => LeaveGroupRequestEntity,
    (request: LeaveGroupRequestEntity) => request.carpoolingGroup,
  )
  leaveGroupRequests: LeaveGroupRequestEntity[]

  @OneToMany(
    () => CarpoolingLogEntity,
    (log: CarpoolingLogEntity) => log.carpoolingGroup,
  )
  carpoolingLogs: CarpoolingLogEntity

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date
}
