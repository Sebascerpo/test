import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './infrastructure/adapters/products.controller';
import { ProductRepositoryPort } from './application/ports/product.repository.port';
import { TypeOrmProductRepository } from './infrastructure/adapters/typeorm-product.repository';
import { ProductOrmEntity } from './infrastructure/adapters/product.orm-entity';
import { ProductSeederService } from './product-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    {
      provide: ProductRepositoryPort,
      useClass: TypeOrmProductRepository,
    },
    ProductSeederService,
  ],
  exports: [ProductRepositoryPort],
})
export class ProductsModule {}
