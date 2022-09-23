import { MigrationInterface, QueryRunner } from 'typeorm'

export class editPhoneNumberLength1663953873067 implements MigrationInterface {
  name = 'editPhoneNumberLength1663953873067'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_12ddd8bb2e7beaa85047338c62"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "phoneNumber"
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "phoneNumber" character varying(15)
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12ddd8bb2e7beaa85047338c62" ON "users" ("phoneNumber", "deletedAt")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_12ddd8bb2e7beaa85047338c62"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "phoneNumber"
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "phoneNumber" character varying(10)
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12ddd8bb2e7beaa85047338c62" ON "users" ("phoneNumber", "deletedAt")
        `)
  }
}
