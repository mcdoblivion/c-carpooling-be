import { MigrationInterface, QueryRunner } from 'typeorm'

export class initCarpoolingDatabaseModel1663354932018
  implements MigrationInterface
{
  name = 'initCarpoolingDatabaseModel1663354932018'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."addresses_type_enum" AS ENUM('Home', 'Work')
        `)
    await queryRunner.query(`
            CREATE TABLE "addresses" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "fullAddress" character varying NOT NULL,
                "longitude" character varying NOT NULL,
                "latitude" character varying NOT NULL,
                "type" "public"."addresses_type_enum" NOT NULL,
                CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ad03a2107269bcec2331b7f885" ON "addresses" ("userId", "type")
        `)
    await queryRunner.query(`
            CREATE TABLE "carpooling_groups" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "driverUserId" integer NOT NULL,
                "groupName" character varying NOT NULL,
                "departureTime" TIME WITH TIME ZONE NOT NULL,
                "comebackTime" TIME WITH TIME ZONE NOT NULL,
                "delayDurationInMinutes" integer NOT NULL,
                CONSTRAINT "REL_1b049ee13642ceaaf35a05fd05" UNIQUE ("driverUserId"),
                CONSTRAINT "PK_5a9a77db8e4a8b8ab04c34ff58f" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_614c2ff36426923a8a8c42c24b" ON "carpooling_groups" ("groupName", "driverUserId")
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."carpooling_logs_directiontype_enum" AS ENUM(' Home to Work', ' Work to Home')
        `)
    await queryRunner.query(`
            CREATE TABLE "carpooling_logs" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "carpoolingGroupId" integer NOT NULL,
                "date" date NOT NULL,
                "directionType" "public"."carpooling_logs_directiontype_enum" NOT NULL,
                "isAbsent" boolean NOT NULL,
                CONSTRAINT "PK_8bb4995ba08043453d0661f8f6f" PRIMARY KEY ("id")
            )
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
            CREATE TYPE "public"."day_off_requests_directiontype_enum" AS ENUM(' Home to Work', ' Work to Home')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."day_off_requests_status_enum" AS ENUM('Pending', 'Accepted', 'Rejected')
        `)
    await queryRunner.query(`
            CREATE TABLE "day_off_requests" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "date" date NOT NULL,
                "directionType" "public"."day_off_requests_directiontype_enum" NOT NULL,
                "status" "public"."day_off_requests_status_enum" NOT NULL,
                CONSTRAINT "PK_a4dc29c6a6800c7758b33241b9b" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."drivers_status_enum" AS ENUM('Pending', 'Accepted', 'Rejected')
        `)
    await queryRunner.query(`
            CREATE TABLE "drivers" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "registrationCertificateNumber" character varying NOT NULL,
                "driverLicenseNumber" character varying NOT NULL,
                "registrationCertificateFrontPhotoURL" character varying NOT NULL,
                "registrationCertificateBackPhotoURL" character varying NOT NULL,
                "driverLicenseFrontPhotoURL" character varying NOT NULL,
                "driverLicenseBackPhotoURL" character varying NOT NULL,
                "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'Pending',
                CONSTRAINT "REL_57d866371f392f459cd9ee46f6" UNIQUE ("userId"),
                CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."leave_group_requests_status_enum" AS ENUM('Pending', 'Accepted', 'Rejected')
        `)
    await queryRunner.query(`
            CREATE TABLE "leave_group_requests" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "carpoolingGroupId" integer NOT NULL,
                "date" date NOT NULL,
                "status" "public"."leave_group_requests_status_enum" NOT NULL,
                CONSTRAINT "PK_534ad56e1c6cbe973b336c750c6" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "payment_methods" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "lastFourDigits" character varying NOT NULL,
                "cardType" character varying NOT NULL,
                "stripePaymentMethodID" character varying NOT NULL,
                CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "ICNumber" character varying NOT NULL,
                "dateOfBirth" date NOT NULL,
                "gender" character varying NOT NULL,
                "avatarURL" character varying,
                CONSTRAINT "REL_8481388d6325e752cd4d7e26c6" UNIQUE ("userId"),
                CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."vehicles_fueltype_enum" AS ENUM('Diesel', 'Gasoline')
        `)
    await queryRunner.query(`
            CREATE TABLE "vehicles" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "driverId" integer NOT NULL,
                "licensePlate" character varying NOT NULL,
                "numberOfSeats" integer NOT NULL,
                "brand" character varying NOT NULL,
                "color" character varying NOT NULL,
                "fuelConsumptionPer100kms" integer NOT NULL,
                "fuelType" "public"."vehicles_fueltype_enum" NOT NULL,
                CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_transactions_actiontype_enum" AS ENUM('Top up', 'Spent', 'Refund', 'Referral')
        `)
    await queryRunner.query(`
            CREATE TABLE "wallet_transactions" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "walletId" integer NOT NULL,
                "actionType" "public"."wallet_transactions_actiontype_enum" NOT NULL,
                "value" integer NOT NULL,
                "description" character varying,
                CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "wallets" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer NOT NULL,
                "currentBalance" integer NOT NULL,
                "lifetimeBalance" integer NOT NULL,
                CONSTRAINT "REL_2ecdb33f23e9a6fc392025c0b9" UNIQUE ("userId"),
                CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "googleId" character varying
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "facebookId" character varying
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "carpoolingGroupId" integer
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_6349b69c7b387a01b2d68e606f2" FOREIGN KEY ("carpoolingGroupId") REFERENCES "carpooling_groups"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "addresses"
            ADD CONSTRAINT "FK_95c93a584de49f0b0e13f753630" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups"
            ADD CONSTRAINT "FK_1b049ee13642ceaaf35a05fd053" FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs"
            ADD CONSTRAINT "FK_6cb640f9795d7fa1f11192fff0d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs"
            ADD CONSTRAINT "FK_d104659e3e185efe6411097b6c5" FOREIGN KEY ("carpoolingGroupId") REFERENCES "carpooling_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "day_off_requests"
            ADD CONSTRAINT "FK_de78359b3b608e2724906067dc9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD CONSTRAINT "FK_57d866371f392f459cd9ee46f6a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
            ADD CONSTRAINT "FK_8adf6a52410931dce1c416a57f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests"
            ADD CONSTRAINT "FK_478696a1ab5144446efa9799fed" FOREIGN KEY ("carpoolingGroupId") REFERENCES "carpooling_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods"
            ADD CONSTRAINT "FK_580f1dbf7bceb9c2cde8baf7ff4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "user_profiles"
            ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD CONSTRAINT "FK_28d7607488252336b22511e9e80" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "wallets"
            ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf"
        `)
    await queryRunner.query(`
            ALTER TABLE "vehicles" DROP CONSTRAINT "FK_28d7607488252336b22511e9e80"
        `)
    await queryRunner.query(`
            ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_580f1dbf7bceb9c2cde8baf7ff4"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests" DROP CONSTRAINT "FK_478696a1ab5144446efa9799fed"
        `)
    await queryRunner.query(`
            ALTER TABLE "leave_group_requests" DROP CONSTRAINT "FK_8adf6a52410931dce1c416a57f4"
        `)
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP CONSTRAINT "FK_57d866371f392f459cd9ee46f6a"
        `)
    await queryRunner.query(`
            ALTER TABLE "day_off_requests" DROP CONSTRAINT "FK_de78359b3b608e2724906067dc9"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs" DROP CONSTRAINT "FK_d104659e3e185efe6411097b6c5"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_logs" DROP CONSTRAINT "FK_6cb640f9795d7fa1f11192fff0d"
        `)
    await queryRunner.query(`
            ALTER TABLE "carpooling_groups" DROP CONSTRAINT "FK_1b049ee13642ceaaf35a05fd053"
        `)
    await queryRunner.query(`
            ALTER TABLE "addresses" DROP CONSTRAINT "FK_95c93a584de49f0b0e13f753630"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_6349b69c7b387a01b2d68e606f2"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "carpoolingGroupId"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "facebookId"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "googleId"
        `)
    await queryRunner.query(`
            DROP TABLE "wallets"
        `)
    await queryRunner.query(`
            DROP TABLE "wallet_transactions"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."wallet_transactions_actiontype_enum"
        `)
    await queryRunner.query(`
            DROP TABLE "vehicles"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."vehicles_fueltype_enum"
        `)
    await queryRunner.query(`
            DROP TABLE "user_profiles"
        `)
    await queryRunner.query(`
            DROP TABLE "payment_methods"
        `)
    await queryRunner.query(`
            DROP TABLE "leave_group_requests"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."leave_group_requests_status_enum"
        `)
    await queryRunner.query(`
            DROP TABLE "drivers"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."drivers_status_enum"
        `)
    await queryRunner.query(`
            DROP TABLE "day_off_requests"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."day_off_requests_status_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."day_off_requests_directiontype_enum"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9d8e4043b9531810b8d6346d38"
        `)
    await queryRunner.query(`
            DROP TABLE "carpooling_logs"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."carpooling_logs_directiontype_enum"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_614c2ff36426923a8a8c42c24b"
        `)
    await queryRunner.query(`
            DROP TABLE "carpooling_groups"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ad03a2107269bcec2331b7f885"
        `)
    await queryRunner.query(`
            DROP TABLE "addresses"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."addresses_type_enum"
        `)
  }
}
