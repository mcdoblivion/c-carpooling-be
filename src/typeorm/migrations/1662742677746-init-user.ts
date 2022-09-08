import { MigrationInterface, QueryRunner } from 'typeorm'

export class initUser1662742677746 implements MigrationInterface {
  name = 'initUser1662742677746'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."users_2famethod_enum" AS ENUM('OFF', 'EMAIL', 'SMS')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'NORMAL_USER')
        `)
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "username" character varying(100),
                "email" character varying(200) NOT NULL,
                "phoneNumber" character varying(10),
                "password" text,
                "2FAMethod" "public"."users_2famethod_enum" NOT NULL DEFAULT 'OFF',
                "isActive" boolean NOT NULL DEFAULT true,
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'NORMAL_USER',
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12ddd8bb2e7beaa85047338c62" ON "users" ("phoneNumber", "deletedAt")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c4dd678058708647766157c6e4" ON "users" ("email", "deletedAt")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a1e512e754ab75371cea3cb659" ON "users" ("username", "deletedAt")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a1e512e754ab75371cea3cb659"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c4dd678058708647766157c6e4"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_12ddd8bb2e7beaa85047338c62"
        `)
    await queryRunner.query(`
            DROP TABLE "users"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."users_2famethod_enum"
        `)
  }
}
