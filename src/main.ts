import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Enable CORS with credentials support for cookies
  app.enableCors({
    origin: true, // Allow all origins in development; configure for production
    credentials: true, // Allow cookies to be sent
  });

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigurationService);

  // Validate required configuration
  try {
    config.validateRequiredConfig();
    logger.log('Configuration validated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Configuration validation failed:', message);
    process.exit(1);
  }

  const port = config.appPort;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${config.nodeEnv}`);
}

void bootstrap();
