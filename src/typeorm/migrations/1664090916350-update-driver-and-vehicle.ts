import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateDriverAndVehicle1664090916350 implements MigrationInterface {
  name = 'updateDriverAndVehicle1664090916350'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "registrationCertificateNumber"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "registrationCertificateFrontPhotoURL"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "registrationCertificateBackPhotoURL"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "vehicleIdForCarpooling" integer
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD CONSTRAINT "UQ_99a262281ff6996f4fadff24dd4" UNIQUE ("vehicleIdForCarpooling")
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "registrationCertificateNumber" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "registrationCertificateFrontPhotoURL" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "registrationCertificateBackPhotoURL" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD CONSTRAINT "FK_99a262281ff6996f4fadff24dd4" FOREIGN KEY ("vehicleIdForCarpooling") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP CONSTRAINT "FK_99a262281ff6996f4fadff24dd4"
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP COLUMN "registrationCertificateBackPhotoURL"
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP COLUMN "registrationCertificateFrontPhotoURL"
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP COLUMN "registrationCertificateNumber"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP CONSTRAINT "UQ_99a262281ff6996f4fadff24dd4"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "vehicleIdForCarpooling"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "registrationCertificateBackPhotoURL" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "registrationCertificateFrontPhotoURL" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "registrationCertificateNumber" character varying NOT NULL
        `)
  }
}
