import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING','APPROVED','DECLINED','ERROR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."transactions_payment_method_enum" AS ENUM('CREDIT_CARD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."deliveries_status_enum" AS ENUM('ASSIGNED','PREPARING','SHIPPED','DELIVERED','CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "price" integer NOT NULL,
        "stock" integer NOT NULL,
        "image_url" character varying,
        "category" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "address" text,
        "city" character varying,
        "postal_code" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email"),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reference" character varying NOT NULL,
        "product_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "amount" integer NOT NULL,
        "base_fee" integer NOT NULL,
        "delivery_fee" integer NOT NULL,
        "total_amount" integer NOT NULL,
        "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING',
        "payment_method" "public"."transactions_payment_method_enum" NOT NULL DEFAULT 'CREDIT_CARD',
        "external_transaction_id" character varying,
        "external_reference" character varying,
        "error_message" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" uuid NOT NULL,
        "transaction_reference" character varying NOT NULL,
        "product_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "address_snapshot" text NOT NULL,
        "city_snapshot" character varying NOT NULL,
        "postal_code_snapshot" character varying,
        "status" "public"."deliveries_status_enum" NOT NULL DEFAULT 'ASSIGNED',
        "assigned_at" TIMESTAMP NOT NULL,
        "delivered_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_deliveries_transaction_id" UNIQUE ("transaction_id"),
        CONSTRAINT "UQ_deliveries_transaction_reference" UNIQUE ("transaction_reference"),
        CONSTRAINT "PK_deliveries_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deliveries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."deliveries_status_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."transactions_payment_method_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."transactions_status_enum";`);
  }
}
