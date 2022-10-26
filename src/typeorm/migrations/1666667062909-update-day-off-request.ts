import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateDayOffRequest1666667062909 implements MigrationInterface {
  name = 'updateDayOffRequest1666667062909'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9d8e4043b9531810b8d6346d38"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."carpooling_logs_directiontype_enum"
            RENAME TO "carpooling_logs_directiontype_enum_old"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."carpooling_logs_directiontype_enum" AS ENUM('Home to Work', 'Work to Home')
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs"
            ALTER COLUMN "directionType" TYPE "public"."carpooling_logs_directiontype_enum" USING "directionType"::"text"::"public"."carpooling_logs_directiontype_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."carpooling_logs_directiontype_enum_old"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6da79e847cefca6920e8ea3a4e"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."day_off_requests_directiontype_enum"
            RENAME TO "day_off_requests_directiontype_enum_old"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."day_off_requests_directiontype_enum" AS ENUM('Home to Work', 'Work to Home')
        `)
    await queryRunner.query(`
            ALTER TABLE "day_off_requests"
            ALTER COLUMN "directionType" TYPE "public"."day_off_requests_directiontype_enum" USING "directionType"::"text"::"public"."day_off_requests_directiontype_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."day_off_requests_directiontype_enum_old"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9d8e4043b9531810b8d6346d38" ON "carpooling_logs" (
                "userId",
                "carpoolingGroupId",
                "date",
                "directionType"
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6da79e847cefca6920e8ea3a4e" ON "day_off_requests" (
                "userId",
                "carpoolingGroupId",
                "date",
                "directionType"
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6da79e847cefca6920e8ea3a4e"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9d8e4043b9531810b8d6346d38"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."day_off_requests_directiontype_enum_old" AS ENUM(' Home to Work', ' Work to Home')
        `)
    await queryRunner.query(`
            ALTER TABLE "day_off_requests"
            ALTER COLUMN "directionType" TYPE "public"."day_off_requests_directiontype_enum_old" USING "directionType"::"text"::"public"."day_off_requests_directiontype_enum_old"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."day_off_requests_directiontype_enum"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."day_off_requests_directiontype_enum_old"
            RENAME TO "day_off_requests_directiontype_enum"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6da79e847cefca6920e8ea3a4e" ON "day_off_requests" (
                "userId",
                "date",
                "directionType",
                "carpoolingGroupId"
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."carpooling_logs_directiontype_enum_old" AS ENUM(' Home to Work', ' Work to Home')
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs"
            ALTER COLUMN "directionType" TYPE "public"."carpooling_logs_directiontype_enum_old" USING "directionType"::"text"::"public"."carpooling_logs_directiontype_enum_old"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."carpooling_logs_directiontype_enum"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."carpooling_logs_directiontype_enum_old"
            RENAME TO "carpooling_logs_directiontype_enum"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9d8e4043b9531810b8d6346d38" ON "carpooling_logs" (
                "userId",
                "carpoolingGroupId",
                "date",
                "directionType"
            )
        `)
  }
}
