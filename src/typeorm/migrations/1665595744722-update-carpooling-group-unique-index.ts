import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateCarpoolingGroupUniqueIndex1665595744722
  implements MigrationInterface
{
  name = 'updateCarpoolingGroupUniqueIndex1665595744722'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c763179e80a6787c5ff489a8da"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f142c3f348b773b12a1b61e125" ON "carpooling_groups" ("driverUserId")
            WHERE "deletedAt" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f142c3f348b773b12a1b61e125"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c763179e80a6787c5ff489a8da" ON "carpooling_groups" ("driverUserId", "groupName")
            WHERE ("deletedAt" IS NULL)
        `)
  }
}
