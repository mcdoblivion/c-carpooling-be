import { Column, Entity, Index } from 'typeorm'
import {} from '.'
import { Role } from '../enums'
import { BaseEntity } from './base.entity'

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
  })
  email: string

  @Column({
    type: 'text',
    select: false,
  })
  password: string

  @Column({ type: 'varchar', nullable: true })
  avatar: string

  @Column({ type: 'varchar', nullable: true })
  description: string

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.NORMAL_USER,
  })
  role: Role
}
