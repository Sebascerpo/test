import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from './infrastructure/adapters/product.orm-entity';

@Injectable()
export class ProductSeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly productRepository: Repository<ProductOrmEntity>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.productRepository.count();
    if (count > 0) return;

    const products = [
      {
        name: 'Wireless Headphones',
        description:
          'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
        price: 149990,
        stock: 15,
        imageUrl: '/products/headphones.jpg',
        category: 'Electronics',
      },
      {
        name: 'Smart Watch Pro',
        description:
          'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
        price: 299990,
        stock: 8,
        imageUrl: '/products/smartwatch.jpg',
        category: 'Electronics',
      },
      {
        name: 'Mechanical Keyboard',
        description:
          'RGB mechanical keyboard with Cherry MX switches and programmable keys.',
        price: 179990,
        stock: 12,
        imageUrl: '/products/keyboard.jpg',
        category: 'Accessories',
      },
      {
        name: 'Wireless Mouse',
        description:
          'Ergonomic wireless mouse with adjustable DPI and silent clicks.',
        price: 79990,
        stock: 25,
        imageUrl: '/products/mouse.jpg',
        category: 'Accessories',
      },
      {
        name: 'Fast Charger 65W',
        description:
          'Universal fast charger compatible with laptops, phones, and tablets.',
        price: 59990,
        stock: 30,
        imageUrl: '/products/charger.jpg',
        category: 'Accessories',
      },
    ];

    await this.productRepository.save(products);
    console.log('Database seeded with dummy products.');
  }
}
