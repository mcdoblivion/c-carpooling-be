import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateUserUniqueIndex1663963904871 implements MigrationInterface {
  name = 'updateUserUniqueIndex1663963904871'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c4dd678058708647766157c6e4"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a1e512e754ab75371cea3cb659"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_12ddd8bb2e7beaa85047338c62"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_609791a909d33b5ae7a1c44f03" ON "users" ("phoneNumber")
            WHERE "deletedAt" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_262d8d714a42e664d987714a75" ON "users" ("email")
            WHERE "deletedAt" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_bfcfa74a1bc4575ba39ee66e59" ON "users" ("username")
            WHERE "deletedAt" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3493b9c88477707543515d86c9" ON "users" ("phoneNumber", "deletedAt")
            WHERE "deletedAt" IS NOT NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_37c57745768f84e4daabe9699a" ON "users" ("email", "deletedAt")
            WHERE "deletedAt" IS NOT NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f2070cee58abac59ca78c413da" ON "users" ("username", "deletedAt")
            WHERE "deletedAt" IS NOT NULL
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_efb618b255f4761307da8bd78c" ON "user_profiles" ("firstName", "lastName")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_efb618b255f4761307da8bd78c"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f2070cee58abac59ca78c413da"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_37c57745768f84e4daabe9699a"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3493b9c88477707543515d86c9"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bfcfa74a1bc4575ba39ee66e59"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_262d8d714a42e664d987714a75"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_609791a909d33b5ae7a1c44f03"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12ddd8bb2e7beaa85047338c62" ON "users" ("deletedAt", "phoneNumber")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a1e512e754ab75371cea3cb659" ON "users" ("username", "deletedAt")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c4dd678058708647766157c6e4" ON "users" ("email", "deletedAt")
        `)
  }
}
