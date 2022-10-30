import { Column, Entity, Index } from 'typeorm'
import { CronJobType } from '../enums/cron-job-type'
import { BaseEntity } from './base.entity'

@Entity({ name: 'cron_jobs' })
@Index(['name', 'type', 'date'], {
  unique: true,
  where: '"finishedAt" IS NULL',
})
export class CronJobEntity extends BaseEntity {
  @Column()
  name: string

  @Column()
  description: string

  @Column({ type: 'enum', enum: CronJobType })
  type: CronJobType

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'timestamp without time zone', nullable: true })
  finishedAt: Date
}
