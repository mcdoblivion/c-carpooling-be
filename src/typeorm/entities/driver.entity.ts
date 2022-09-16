import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { VehicleEntity } from '.'
import { RequestStatus } from '../enums'
import { BaseEntity } from './base.entity'
import { UserEntity } from './user.entity'

@Entity({ name: 'drivers' })
export class DriverEntity extends BaseEntity {
  @OneToOne(() => UserEntity, (user: UserEntity) => user.driver, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity

  @Column()
  userId: number

  @Column()
  registrationCertificateNumber: string

  @Column()
  driverLicenseNumber: string

  @Column()
  registrationCertificateFrontPhotoURL: string

  @Column()
  registrationCertificateBackPhotoURL: string

  @Column()
  driverLicenseFrontPhotoURL: string

  @Column()
  driverLicenseBackPhotoURL: string

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus

  @OneToMany(() => VehicleEntity, (vehicle: VehicleEntity) => vehicle.driver)
  vehicles: VehicleEntity[]
}
