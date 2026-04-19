import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.05,
    });
  }

  const app = await NestFactory.create(AppModule);

  // Global exception filter - must be registered before interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response interceptor - wraps all responses in consistent format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS configuration
  // Allow all origins in dev — React Native doesn't have a fixed origin.
  // In production, restrict to your deployed domain via FRONTEND_URL env var.
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // true = reflect the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:${port}`);
}

bootstrap();
