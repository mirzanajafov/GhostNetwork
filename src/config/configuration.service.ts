import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJwtConfig } from './interfaces/jwt-config.interface';

/**
 * Centralized configuration service with type safety and validation
 * Wraps ConfigService to provide better developer experience
 * Implements IJwtConfig for dependency injection in token-related services
 */
@Injectable()
export class ConfigurationService implements IJwtConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get config value with type safety and default fallback
   */
  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.configService.get<T>(key);
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Get config value or throw error if not found
   */
  getOrThrow<T = string>(key: string): T {
    return this.configService.getOrThrow<T>(key);
  }

  // Application config
  get appPort(): number {
    return this.get<number>('app.port', 3000);
  }

  get nodeEnv(): string {
    return this.get('app.nodeEnv', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // JWT config (IJwtConfig implementation)
  get jwtSecret(): string {
    return this.get('jwt.secret', '');
  }

  get jwtSecretExpire(): string {
    return this.get('jwt.secretExpire', '15m');
  }

  get jwtRefreshSecret(): string {
    return this.get('jwt.refreshSecret', '');
  }

  get jwtRefreshSecretExpire(): string {
    return this.get('jwt.refreshSecretExpire', '7d');
  }

  // Database config
  get databaseUrl(): string {
    return this.get('database.url', '');
  }

  /**
   * Validate required configuration values
   * Call this in main.ts or app module initialization
   */
  validateRequiredConfig(): void {
    const requiredKeys = ['jwt.secret', 'jwt.refreshSecret', 'database.url'];

    const missing: string[] = [];

    for (const key of requiredKeys) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = this.configService.get(key);
      if (!value) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
}
