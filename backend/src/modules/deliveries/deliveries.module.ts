import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryRepositoryPort } from './application/ports/delivery.repository.port';
import { TypeOrmDeliveryRepository } from './infrastructure/adapters/typeorm-delivery.repository';
import { DeliveryOrmEntity } from './infrastructure/adapters/delivery.orm-entity';
import { DeliveriesController } from './infrastructure/adapters/deliveries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity])],
  controllers: [DeliveriesController],
  providers: [
    {
      provide: DeliveryRepositoryPort,
      useClass: TypeOrmDeliveryRepository,
    },
  ],
  exports: [DeliveryRepositoryPort, TypeOrmModule],
})
export class DeliveriesModule {}
