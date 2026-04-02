import { registerAs } from '@nestjs/config';

/**
 * Database configuration using registerAs pattern
 * Provides database connection settings
 */
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
