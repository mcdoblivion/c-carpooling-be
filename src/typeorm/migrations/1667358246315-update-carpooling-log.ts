import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateCarpoolingLog1667358246315 implements MigrationInterface {
  name = 'updateCarpoolingLog1667358246315'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs"
            ADD "carpoolingFee" integer NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs" DROP COLUMN "carpoolingFee"
        `)
  }
}
