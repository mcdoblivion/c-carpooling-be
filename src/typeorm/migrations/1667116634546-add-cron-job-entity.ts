import { MigrationInterface, QueryRunner } from 'typeorm'

export class addCronJobEntity1667116634546 implements MigrationInterface {
  name = 'addCronJobEntity1667116634546'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."cron_jobs_type_enum" AS ENUM('Leave group request', 'Day off request')
        `)
    await queryRunner.query(`
            CREATE TABLE "cron_jobs" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "type" "public"."cron_jobs_type_enum" NOT NULL,
                "date" date NOT NULL,
                "finishedAt" TIMESTAMP,
                CONSTRAINT "PK_189a8029b8fff4f0e2040f652ee" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_be1888fdea4cedbe3fdd64cd46" ON "cron_jobs" ("name", "type", "date")
            WHERE "finishedAt" IS NULL
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_d70fb705f019be488b53c01503" ON "day_off_requests" ("date", "isProcessed")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_5465a18f8feeb70efd71b5cc05" ON "leave_group_requests" ("date", "isProcessed")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5465a18f8feeb70efd71b5cc05"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d70fb705f019be488b53c01503"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_be1888fdea4cedbe3fdd64cd46"
        `)
    await queryRunner.query(`
            DROP TABLE "cron_jobs"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."cron_jobs_type_enum"
        `)
  }
}
