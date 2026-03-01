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
    const products = [
      {
        name: 'Wireless Headphones',
        description:
          'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
        price: 149990,
        stock: 15,
        imageUrl:
          'https://images.unsplash.com/photo-1505740487311-c1b9204cd153?q=80&w=1000&auto=format&fit=crop',
        category: 'Electronics',
      },
      {
        name: 'Smart Watch Pro',
        description:
          'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
        price: 299990,
        stock: 8,
        imageUrl:
          'https://images.unsplash.com/photo-1523275335660-02244a2936f4?q=80&w=1000&auto=format&fit=crop',
        category: 'Electronics',
      },
      {
        name: 'Mechanical Keyboard',
        description:
          'RGB mechanical keyboard with Cherry MX switches and programmable keys.',
        price: 179990,
        stock: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1000&auto=format&fit=crop',
        category: 'Accessories',
      },
      {
        name: 'Wireless Mouse',
        description:
          'Ergonomic wireless mouse with adjustable DPI and silent clicks.',
        price: 79990,
        stock: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?q=80&w=1000&auto=format&fit=crop',
        category: 'Accessories',
      },
      {
        name: 'Fast Charger 65W',
        description:
          'Universal fast charger compatible with laptops, phones, and tablets.',
        price: 59990,
        stock: 30,
        imageUrl:
          'https://images.unsplash.com/photo-1612815154858-60aa4c59ebe1?q=80&w=1000&auto=format&fit=crop',
        category: 'Accessories',
      },
    ];

    const currentCount = await this.productRepository.count();

    if (currentCount === 0) {
      await this.productRepository.save(products);
      console.log('Database seeded with products and real images.');
    } else {
      for (const productData of products) {
        const existing = await this.productRepository.findOne({
          where: { name: productData.name },
        });

        if (
          existing &&
          (existing.imageUrl.startsWith('/products/') || !existing.imageUrl)
        ) {
          existing.imageUrl = productData.imageUrl;
          await this.productRepository.save(existing);
          console.log(`Updated image for product: ${productData.name}`);
        }
      }
    }
  }
}
