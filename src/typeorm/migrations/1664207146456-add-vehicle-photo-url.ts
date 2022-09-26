import { MigrationInterface, QueryRunner } from 'typeorm'

export class addVehiclePhotoUrl1664207146456 implements MigrationInterface {
  name = 'addVehiclePhotoUrl1664207146456'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "photoURL" character varying NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP COLUMN "photoURL"
        `)
  }
}
