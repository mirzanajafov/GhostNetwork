import { registerAs } from '@nestjs/config';

/**
 * Application configuration using registerAs pattern
 * Contains general application settings
 */
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT as string, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export default appConfig;
