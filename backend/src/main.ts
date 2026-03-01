import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 3002;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(PORT);
  console.log(`🚀 Payment API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`💳 Payment: http://localhost:${PORT}/api/payment/process`);
}

bootstrap().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
