import { registerAs } from '@nestjs/config';

/**
 * JWT configuration using registerAs pattern
 * Provides type-safe JWT settings for authentication
 */
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'default-refresh-secret-change-in-production',
  secretExpire: process.env.JWT_SECRET_EXPIRE || '15m',
  refreshSecretExpire: process.env.JWT_REFRESH_SECRET_EXPIRE || '7d',
}));
