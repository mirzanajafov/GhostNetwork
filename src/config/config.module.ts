import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './configuration.service';
import { appConfig } from './configs/app.config';
import { jwtConfig } from './configs/jwt.config';
import { databaseConfig } from './configs/database.config';

/**
 * Global configuration module
 * Loads all configuration namespaces (app, jwt, database)
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, databaseConfig],
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class AppConfigModule {}
