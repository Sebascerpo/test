import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/shared/infrastructure/database.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { HealthController } from './modules/shared/infrastructure/health.controller';
import { AppConfigController } from './modules/shared/infrastructure/app-config.controller';
import { PaymentModule } from './modules/payment/payment.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ProductsModule,
    CustomersModule,
    TransactionsModule,
    PaymentModule,
    DeliveriesModule,
  ],
  controllers: [HealthController, AppConfigController],
})
export class AppModule {}
