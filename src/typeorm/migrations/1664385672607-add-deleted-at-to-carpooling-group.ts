import { MigrationInterface, QueryRunner } from 'typeorm'

export class addDeletedAtToCarpoolingGroup1664385672607
  implements MigrationInterface
{
  name = 'addDeletedAtToCarpoolingGroup1664385672607'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_614c2ff36426923a8a8c42c24b"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD "deletedAt" TIMESTAMP WITH TIME ZONE
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c763179e80a6787c5ff489a8da" ON "carpooling_groups" ("groupName", "driverUserId")
            WHERE "deletedAt" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c763179e80a6787c5ff489a8da"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP COLUMN "deletedAt"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_614c2ff36426923a8a8c42c24b" ON "carpooling_groups" ("driverUserId", "groupName")
        `)
  }
}
