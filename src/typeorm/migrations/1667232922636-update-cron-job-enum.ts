import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateCronJobEnum1667232922636 implements MigrationInterface {
  name = 'updateCronJobEnum1667232922636'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_be1888fdea4cedbe3fdd64cd46"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."cron_jobs_type_enum"
            RENAME TO "cron_jobs_type_enum_old"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."cron_jobs_type_enum" AS ENUM('Leave group request', 'Carpooling log')
        `)
    await queryRunner.query(`
            ALTER TABLE "cron_jobs"
            ALTER COLUMN "type" TYPE "public"."cron_jobs_type_enum" USING "type"::"text"::"public"."cron_jobs_type_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."cron_jobs_type_enum_old"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_be1888fdea4cedbe3fdd64cd46" ON "cron_jobs" ("name", "type", "date")
            WHERE "finishedAt" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_be1888fdea4cedbe3fdd64cd46"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."cron_jobs_type_enum_old" AS ENUM('Leave group request', 'Day off request')
        `)
    await queryRunner.query(`
            ALTER TABLE "cron_jobs"
            ALTER COLUMN "type" TYPE "public"."cron_jobs_type_enum_old" USING "type"::"text"::"public"."cron_jobs_type_enum_old"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."cron_jobs_type_enum"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."cron_jobs_type_enum_old"
            RENAME TO "cron_jobs_type_enum"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_be1888fdea4cedbe3fdd64cd46" ON "cron_jobs" ("name", "type", "date")
            WHERE ("finishedAt" IS NULL)
        `)
  }
}
