import { MigrationInterface, QueryRunner } from 'typeorm'

export class addCarpoolingPayment1666148394066 implements MigrationInterface {
  name = 'addCarpoolingPayment1666148394066'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."carpooling_payments_status_enum" AS ENUM('Pending', 'Completed', 'Failed')
        `)
    await queryRunner.query(`
            CREATE TABLE "carpooling_payments" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "carpoolingGroupId" integer NOT NULL,
                "carpoolingFee" integer NOT NULL,
                "status" "public"."carpooling_payments_status_enum" NOT NULL DEFAULT 'Pending',
                CONSTRAINT "PK_594bd45951d5faf185425f3e8d4" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_payments"
            ADD CONSTRAINT "FK_79ff7d2013fcdc19448d132dbec" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_payments"
            ADD CONSTRAINT "FK_869dddb19762822aed35aed123f" FOREIGN KEY ("carpoolingGroupId") REFERENCES "carpooling_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "carpooling_payments" DROP CONSTRAINT "FK_869dddb19762822aed35aed123f"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_payments" DROP CONSTRAINT "FK_79ff7d2013fcdc19448d132dbec"
        `)
    await queryRunner.query(`
            DROP TABLE "carpooling_payments"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."carpooling_payments_status_enum"
        `)
  }
}
