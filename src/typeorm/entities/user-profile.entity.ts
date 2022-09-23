import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'user_profiles' })
@Index(['firstName', 'lastName'])
export class UserProfileEntity extends BaseEntity {
  @OneToOne(() => UserEntity, (user: UserEntity) => user.userProfile, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  ICNumber: string

  @Column({ type: 'date' })
  dateOfBirth: string

  @Column()
  gender: string

  @Column({ nullable: true })
  avatarURL: string
}
