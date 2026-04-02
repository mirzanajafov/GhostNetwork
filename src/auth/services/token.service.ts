import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { IJwtConfig } from '../../config/interfaces/jwt-config.interface';
import { JWT_CONFIG } from '../../config/interfaces/jwt-config.interface';
import * as crypto from 'crypto';

export interface TokenPayload {
  email: string;
  sub: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

interface TokenMetadata {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(JWT_CONFIG) private readonly jwtConfig: IJwtConfig,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(
    token: string,
    userId: string,
    metadata?: TokenMetadata,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = this.calculateExpirationDate(
      this.jwtConfig.jwtRefreshSecretExpire,
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        userAgent: metadata?.userAgent,
        ip: metadata?.ip,
        expiresAt,
      },
    });
  }

  /**
   * Validate and retrieve refresh token from database
   */
  async validateRefreshToken(token: string, userId: string) {
    const tokenHash = this.hashToken(token);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId,
        revoked: false,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return storedToken;
  }

  /**
   * Revoke specific refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });
  }

  /**
   * Revoke refresh token by hash
   */
  async revokeRefreshTokenByHash(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash },
      data: { revoked: true },
    });
  }

  /**
   * Revoke all user's refresh tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Hash token using SHA-256
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Private methods

  private generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.jwtSecret,
      expiresIn: this.jwtConfig.jwtSecretExpire,
    } as JwtSignOptions);
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.jwtRefreshSecret,
      expiresIn: this.jwtConfig.jwtRefreshSecretExpire,
    } as JwtSignOptions);
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const expirationDate = new Date();

    if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn, 10);
      expirationDate.setDate(expirationDate.getDate() + days);
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn, 10);
      expirationDate.setHours(expirationDate.getHours() + hours);
    } else if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn, 10);
      expirationDate.setMinutes(expirationDate.getMinutes() + minutes);
    }

    return expirationDate;
  }
}
