import { MigrationInterface, QueryRunner } from 'typeorm'

export class addStripeCustomerId1664726669216 implements MigrationInterface {
  name = 'addStripeCustomerId1664726669216'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payment_methods" DROP COLUMN "stripePaymentMethodID"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods"
            ADD "stripePaymentMethodId" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods"
            ADD CONSTRAINT "UQ_e37a48f14467d71ce3420424537" UNIQUE ("stripePaymentMethodId")
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods"
            ADD "stripeCustomerId" character varying NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payment_methods" DROP COLUMN "stripeCustomerId"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods" DROP CONSTRAINT "UQ_e37a48f14467d71ce3420424537"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods" DROP COLUMN "stripePaymentMethodId"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods"
            ADD "stripePaymentMethodID" character varying NOT NULL
        `)
  }
}
