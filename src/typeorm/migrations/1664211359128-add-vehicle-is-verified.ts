import { MigrationInterface, QueryRunner } from 'typeorm'

export class addVehicleIsVerified1664211359128 implements MigrationInterface {
  name = 'addVehicleIsVerified1664211359128'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "isVerified" boolean NOT NULL DEFAULT false
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP COLUMN "isVerified"
        `)
  }
}
