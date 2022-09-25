import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { DriverEntity } from '.'
import { FuelType } from '../enums'
import { BaseEntity } from './base.entity'

@Entity({ name: 'vehicles' })
export class VehicleEntity extends BaseEntity {
  @ManyToOne(() => DriverEntity, (driver: DriverEntity) => driver.vehicles, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'driverId' })
  driver: DriverEntity

  @Column()
  driverId: number

  @Column()
  registrationCertificateNumber: string

  @Column()
  registrationCertificateFrontPhotoURL: string

  @Column()
  registrationCertificateBackPhotoURL: string

  @Column()
  licensePlate: string

  @Column()
  numberOfSeats: number

  @Column()
  brand: string

  @Column()
  color: string

  @Column()
  fuelConsumptionPer100kms: number

  @Column({ type: 'enum', enum: FuelType })
  fuelType: FuelType
}
