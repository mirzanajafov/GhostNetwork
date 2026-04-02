import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { PasswordService } from './password.service';
import { User } from '@prisma/client';
import { TokenService, TokenPair, TokenPayload } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.passwordService.hash(password);
    return this.userService.create(email, passwordHash);
  }

  async login(user: User, userAgent?: string, ip?: string): Promise<TokenPair> {
    const payload = this.createTokenPayload(user);
    const tokens = this.tokenService.generateTokenPair(payload);

    await this.tokenService.storeRefreshToken(tokens.refresh_token, user.id, {
      userAgent,
      ip,
    });

    return tokens;
  }

  async refreshTokens(
    user: User,
    oldRefreshToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<TokenPair> {
    // Validate old refresh token
    const storedToken = await this.tokenService.validateRefreshToken(
      oldRefreshToken,
      user.id,
    );

    // Revoke old token (rotation)
    await this.tokenService.revokeRefreshToken(storedToken.id);

    // Generate and store new tokens
    return this.login(user, userAgent, ip);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    await this.tokenService.revokeRefreshTokenByHash(userId, tokenHash);
  }

  async logoutFromAllDevices(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
  }

  // Private helper methods

  private createTokenPayload(user: User): TokenPayload {
    return {
      email: user.email,
      sub: user.id,
    };
  }
}
