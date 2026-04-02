import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { AuthController } from './controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { PasswordService } from './services/password.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigurationService } from 'src/config/configuration.service';
import { JWT_CONFIG } from '../config/interfaces/jwt-config.interface';

@Module({
  imports: [PassportModule, UserModule, PrismaModule, JwtModule.register({})],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    // Provide ConfigurationService as IJwtConfig (dependency inversion)
    {
      provide: JWT_CONFIG,
      useExisting: ConfigurationService,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
