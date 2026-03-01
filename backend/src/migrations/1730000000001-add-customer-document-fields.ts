import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerDocumentFields1730000000001
  implements MigrationInterface
{
  name = 'AddCustomerDocumentFields1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "document_type" character varying;
    `);

    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "document_number" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "document_number";
    `);

    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "document_type";
    `);
  }
}
