// Main Application Module
import { Module } from '@nestjs/common';
import { ProductsController } from './modules/products/infrastructure/adapters/products.controller';
import { TransactionsController } from './modules/transactions/infrastructure/adapters/transactions.controller';
import { HealthController } from './modules/shared/infrastructure/health.controller';
import { InMemoryProductRepository } from './modules/products/infrastructure/adapters/in-memory-product.repository';
import { InMemoryCustomerRepository } from './modules/customers/infrastructure/adapters/in-memory-customer.repository';
import { InMemoryTransactionRepository } from './modules/transactions/infrastructure/adapters/in-memory-transaction.repository';
import { WompiGatewayAdapter } from './modules/wompi/infrastructure/adapters/wompi.gateway.adapter';
import { ProductRepositoryPort } from './modules/products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from './modules/customers/application/ports/customer.repository.port';
import { TransactionRepositoryPort } from './modules/transactions/application/ports/transaction.repository.port';
import {
  WompiGatewayPort,
  WompiConfig,
} from './modules/wompi/application/ports/wompi.gateway.port';

@Module({
  controllers: [ProductsController, TransactionsController, HealthController],
  providers: [
    // Repository Adapters (Ports & Adapters Pattern)
    {
      provide: ProductRepositoryPort,
      useClass: InMemoryProductRepository,
    },
    {
      provide: CustomerRepositoryPort,
      useClass: InMemoryCustomerRepository,
    },
    {
      provide: TransactionRepositoryPort,
      useClass: InMemoryTransactionRepository,
    },
    {
      provide: WompiGatewayPort,
      useClass: WompiGatewayAdapter,
    },
    {
      provide: WompiConfig,
      useValue: {
        publicKey: 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7',
        privateKey: 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg',
        baseUrl: 'https://api-sandbox.co.uat.wompi.dev/v1',
        integrityKey: 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
      },
    },
  ],
})
export class AppModule {}
