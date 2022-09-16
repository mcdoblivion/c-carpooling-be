import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm'
import {
  AddressEntity,
  CarpoolingGroupEntity,
  CarpoolingLogEntity,
  DayOffRequestEntity,
  DriverEntity,
  LeaveGroupRequestEntity,
  PaymentMethodEntity,
  UserProfileEntity,
  WalletEntity,
} from '.'
import { Role, TwoFAMethod } from '../enums'
import { BaseEntity } from './base.entity'

@Entity({ name: 'users' })
@Index(['username', 'deletedAt'], { unique: true })
@Index(['email', 'deletedAt'], { unique: true })
@Index(['phoneNumber', 'deletedAt'], { unique: true })
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  username: string

  @Column({
    type: 'varchar',
    length: 200,
  })
  email: string

  @Column({ nullable: true })
  googleId: string

  @Column({ nullable: true })
  facebookId: string

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  phoneNumber: string

  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  password: string

  @Column({
    type: 'enum',
    enum: TwoFAMethod,
    default: TwoFAMethod.OFF,
  })
  '2FAMethod': TwoFAMethod

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.NORMAL_USER,
  })
  role: Role

  @ManyToOne(
    () => CarpoolingGroupEntity,
    (group: CarpoolingGroupEntity) => group.carpoolers,
    { cascade: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'carpoolingGroupId' })
  carpoolingGroup: CarpoolingGroupEntity

  @Column({ nullable: true })
  carpoolingGroupId: number

  @OneToOne(() => DriverEntity, (driver: DriverEntity) => driver.user)
  driver: DriverEntity

  @OneToOne(() => WalletEntity, (wallet: WalletEntity) => wallet.user)
  wallet: WalletEntity

  @OneToMany(
    () => PaymentMethodEntity,
    (paymentMethod: PaymentMethodEntity) => paymentMethod.user,
  )
  paymentMethods: PaymentMethodEntity[]

  @OneToOne(
    () => UserProfileEntity,
    (profile: UserProfileEntity) => profile.user,
  )
  userProfile: UserProfileEntity

  @OneToMany(() => AddressEntity, (address: AddressEntity) => address.user)
  addresses: AddressEntity[]

  @OneToMany(
    () => DayOffRequestEntity,
    (request: DayOffRequestEntity) => request.user,
  )
  dayOffRequests: DayOffRequestEntity[]

  @OneToMany(
    () => LeaveGroupRequestEntity,
    (request: LeaveGroupRequestEntity) => request.user,
  )
  leaveGroupRequests: LeaveGroupRequestEntity[]

  @OneToMany(() => CarpoolingLogEntity, (log: CarpoolingLogEntity) => log.user)
  carpoolingLogs: CarpoolingLogEntity[]
}
