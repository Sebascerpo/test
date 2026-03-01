import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './infrastructure/adapters/transactions.controller';
import { TransactionRepositoryPort } from './application/ports/transaction.repository.port';
import { TypeOrmTransactionRepository } from './infrastructure/adapters/typeorm-transaction.repository';
import { TransactionOrmEntity } from './infrastructure/adapters/transaction.orm-entity';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    ProductsModule,
    CustomersModule,
    PaymentModule,
  ],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TransactionRepositoryPort,
      useClass: TypeOrmTransactionRepository,
    },
  ],
  exports: [TransactionRepositoryPort],
})
export class TransactionsModule {}
