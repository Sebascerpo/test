import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { Product } from '../../domain/product.entity';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const products = await this.repository.find({
      order: { name: 'ASC' },
    });
    return products.map(this.toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.repository.findOne({ where: { id } });
    return product ? this.toDomain(product) : null;
  }

  async updateStock(id: string, quantityChange: number): Promise<void> {
    // Note: Stock update is handled within a transaction in the use case for better safety
    const product = await this.repository.findOne({ where: { id } });
    if (product) {
      product.stock += quantityChange;
      await this.repository.save(product);
    }
  }

  private toDomain(entity: ProductOrmEntity): Product {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      stock: entity.stock,
      imageUrl: entity.imageUrl,
      category: entity.category,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
