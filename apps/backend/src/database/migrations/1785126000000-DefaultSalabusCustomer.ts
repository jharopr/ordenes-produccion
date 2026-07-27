import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultSalabusCustomer1785126000000 implements MigrationInterface {
  name = 'DefaultSalabusCustomer1785126000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN "is_default" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      INSERT INTO "customers"
        ("business_name", "trade_name", "tax_id", "address", "city", "phone", "is_default")
      SELECT
        'Estructuras Metálicas Salabus S.A.C.',
        'Salabus',
        '20601503094',
        'Mza. I Lote 02-B - Urb. Los Tulipanes, Carapongo - Lurigancho - Lima',
        'Lima',
        '970853536 / 970853496',
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM "customers" WHERE "tax_id" = '20601503094'
      )
    `);
    await queryRunner.query(`UPDATE "customers" SET "is_default" = false`);
    await queryRunner.query(`
      UPDATE "customers"
      SET
        "business_name" = 'Estructuras Metálicas Salabus S.A.C.',
        "trade_name" = 'Salabus',
        "address" = 'Mza. I Lote 02-B - Urb. Los Tulipanes, Carapongo - Lurigancho - Lima',
        "city" = 'Lima',
        "phone" = '970853536 / 970853496',
        "is_default" = true
      WHERE "tax_id" = '20601503094'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_customers_one_default"
      ON "customers" ("is_default") WHERE "is_default" = true
    `);
    await queryRunner.query(`
      UPDATE "production_orders"
      SET "customer_id" = (
        SELECT "id" FROM "customers" WHERE "is_default" = true
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_customers_one_default"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "is_default"`);
  }
}
