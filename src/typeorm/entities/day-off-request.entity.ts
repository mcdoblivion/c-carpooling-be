import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { DirectionType, RequestStatus } from '../enums'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'day_off_requests' })
export class DayOffRequestEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.dayOffRequests, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column({ type: 'date' })
  date: Date

  @Column({ type: 'enum', enum: DirectionType })
  directionType: DirectionType

  @Column({ type: 'enum', enum: RequestStatus })
  status: RequestStatus
}
