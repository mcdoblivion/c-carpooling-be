import { MigrationInterface, QueryRunner } from 'typeorm'

export class addWalletTransactionStatus1664825308799
  implements MigrationInterface
{
  name = 'addWalletTransactionStatus1664825308799'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_transactions_status_enum" AS ENUM('Pending', 'Completed', 'Failed')
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD "status" "public"."wallet_transactions_status_enum" NOT NULL DEFAULT 'Pending'
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP COLUMN "status"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."wallet_transactions_status_enum"
        `)
  }
}
