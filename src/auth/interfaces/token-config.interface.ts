/**
 * JWT configuration interface
 * Following Interface Segregation Principle - only what's needed
 */
export interface IJwtConfig {
  readonly jwtSecret: string;
  readonly jwtSecretExpire: string;
  readonly jwtRefreshSecret: string;
  readonly jwtRefreshSecretExpire: string;
}

/**
 * Injection token for IJwtConfig
 * Use this for dependency injection
 */
export const JWT_CONFIG = 'JWT_CONFIG';
