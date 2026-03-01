import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { TypeOrmCustomerRepository } from './infrastructure/adapters/typeorm-customer.repository';
import { CustomerOrmEntity } from './infrastructure/adapters/customer.orm-entity';
import { CustomersController } from './infrastructure/adapters/customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    {
      provide: CustomerRepositoryPort,
      useClass: TypeOrmCustomerRepository,
    },
  ],
  exports: [CustomerRepositoryPort],
})
export class CustomersModule {}
