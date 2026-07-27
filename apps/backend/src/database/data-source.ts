import 'dotenv/config';
import { DataSource } from 'typeorm';

const isSslEnabled = process.env.DATABASE_SSL === 'true';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  ssl: isSslEnabled
    ? {
        rejectUnauthorized: false,
      }
    : false,

  migrations: [
    'src/database/migrations/*.ts',
  ],

  entities: [
    'src/**/*.entity.ts',
  ],

  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});
