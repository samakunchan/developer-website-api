import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadSecrets } from './common/utils/bao.utils';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // 1. Load secrets from OpenBao before initializing the Nest application
  await loadSecrets();

  // 2. Create NestJS application with CORS and logger enabled
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true, // Allow all origins for development, or configure specifically
      credentials: true,
    },
    logger: ['log', 'error', 'warn'],
  });

  // 3. Register global middleware and filters
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // 4. Start the application on configured port (fallback to 3002 to avoid conflict with website running on 3000)
  const port = process.env.REPLACED_PORT || process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 API is running on: http://localhost:${port}`);
}
bootstrap();
