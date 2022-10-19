import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateCarpoolingGroupTimeType1665594252259
  implements MigrationInterface
{
  name = 'updateCarpoolingGroupTimeType1665594252259'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP COLUMN "departureTime"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD "departureTime" TIME NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP COLUMN "comebackTime"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD "comebackTime" TIME NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP COLUMN "comebackTime"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD "comebackTime" TIME WITH TIME ZONE NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP COLUMN "departureTime"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD "departureTime" TIME WITH TIME ZONE NOT NULL
        `)
  }
}
