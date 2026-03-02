import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';

const PORT = 3002;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.use(helmet());
  const productAssetsCandidates = [
    join(__dirname, '..', 'public', 'products'),
    join(process.cwd(), 'public', 'products'),
    join(process.cwd(), 'backend', 'public', 'products'),
  ];
  const productAssetsPath =
    productAssetsCandidates.find((candidate) => existsSync(candidate)) ??
    productAssetsCandidates[0];

  // Backward compatible static paths for product images:
  // - /products/* (legacy)
  // - /api/products/* (preferred, always under API proxy)
  app.useStaticAssets(productAssetsPath, {
    prefix: '/products/',
  });
  app.useStaticAssets(productAssetsPath, {
    prefix: '/api/products/',
  });
  console.log(`🖼️ Product assets path: ${productAssetsPath}`);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('x-request-id', requestId);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('API for products, customers, transactions and deliveries')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(PORT);
  console.log(`🚀 Payment API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`💳 Payment: http://localhost:${PORT}/api/payment/process`);
  console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
