import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME || 'supervisor_visits',
  ssl: process.env.DB_SSL === 'true',
  poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
}));
