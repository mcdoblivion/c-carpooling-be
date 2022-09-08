import { Column, Entity, Index } from 'typeorm'
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
}
