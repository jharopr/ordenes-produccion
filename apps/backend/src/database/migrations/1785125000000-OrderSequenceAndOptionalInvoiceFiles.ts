import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderSequenceAndOptionalInvoiceFiles1785125000000 implements MigrationInterface {
  name = 'OrderSequenceAndOptionalInvoiceFiles1785125000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "production_order_number_seq" START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "storage_path" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "original_filename" DROP NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customers_tax_id" ON "customers" ("tax_id") WHERE "tax_id" IS NOT NULL`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_customers_tax_id"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "production_order_number_seq"`);
  }
}
