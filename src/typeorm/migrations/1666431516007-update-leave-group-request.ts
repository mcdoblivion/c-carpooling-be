import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateLeaveGroupRequest1666431516007
  implements MigrationInterface
{
  name = 'updateLeaveGroupRequest1666431516007'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
                RENAME COLUMN "status" TO "isProcessed"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."leave_group_requests_status_enum"
            RENAME TO "leave_group_requests_isprocessed_enum"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests" DROP COLUMN "isProcessed"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
            ADD "isProcessed" boolean NOT NULL DEFAULT false
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests" DROP COLUMN "isProcessed"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
            ADD "isProcessed" "public"."leave_group_requests_isprocessed_enum" NOT NULL
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."leave_group_requests_isprocessed_enum"
            RENAME TO "leave_group_requests_status_enum"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
                RENAME COLUMN "isProcessed" TO "status"
        `)
  }
}
