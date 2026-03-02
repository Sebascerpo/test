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
        name: 'Apple iPhone 16 Pro Max 256GB',
        description:
          'Smartphone flagship con pantalla OLED de alta tasa de refresco, cámara avanzada y gran autonomía para uso profesional.',
        price: 6999990,
        stock: 9,
        imageUrl: '/api/products/iphone-16-pro-max-256gb.webp',
        category: 'Smartphones',
      },
      {
        name: 'Samsung Galaxy S26 Ultra 256GB',
        description:
          'Gama alta Android con cámara de alto rendimiento, batería de larga duración y experiencia premium para productividad y contenido.',
        price: 6799990,
        stock: 11,
        imageUrl: '/api/products/samsung-s26-ultra-256gb.webp',
        category: 'Smartphones',
      },
      {
        name: 'Apple MacBook Pro M4 Pro',
        description:
          'Portátil profesional para desarrollo y creación, con alto rendimiento sostenido, excelente autonomía y pantalla de alta fidelidad.',
        price: 10999990,
        stock: 6,
        imageUrl: '/api/products/macbook-m4-pro.jpg',
        category: 'Computadores',
      },
      {
        name: 'NVIDIA GeForce RTX 3050',
        description:
          'Tarjeta gráfica para gaming y trabajo creativo con buen equilibrio entre rendimiento, consumo y precio.',
        price: 1499990,
        stock: 13,
        imageUrl: '/api/products/nvidia-rtx-3050.jpg',
        category: 'Componentes',
      },
      {
        name: 'Logitech MX Keys',
        description:
          'Teclado inalámbrico premium, cómodo para jornadas largas, con gran precisión y batería de alta duración.',
        price: 549990,
        stock: 20,
        imageUrl: '/api/products/logitech-mx-keys.webp',
        category: 'Accessories',
      },
      {
        name: 'Garmin Forerunner 965',
        description:
          'Reloj deportivo avanzado con métricas de entrenamiento, GPS preciso y funciones completas para running y triatlón.',
        price: 2899990,
        stock: 7,
        imageUrl: '/api/products/garmin-forerunner-965.webp',
        category: 'Wearables',
      },
      {
        name: 'Samsung Smart TV QLED 85"',
        description:
          'Televisor QLED 4K de gran formato para entretenimiento inmersivo, ideal para cine en casa y gaming.',
        price: 12499990,
        stock: 4,
        imageUrl: '/api/products/samsung-qled-85in.webp',
        category: 'Televisores',
      },
    ];

    let created = 0;
    let updated = 0;

    for (const productData of products) {
      const existing = await this.productRepository.findOne({
        where: { name: productData.name },
      });

      if (!existing) {
        await this.productRepository.save(productData);
        created += 1;
        continue;
      }

      const shouldUpdate =
        existing.description !== productData.description ||
        existing.price !== productData.price ||
        existing.stock !== productData.stock ||
        existing.imageUrl !== productData.imageUrl ||
        existing.category !== productData.category;

      if (shouldUpdate) {
        existing.description = productData.description;
        existing.price = productData.price;
        existing.stock = productData.stock;
        existing.imageUrl = productData.imageUrl;
        existing.category = productData.category;
        await this.productRepository.save(existing);
        updated += 1;
      }
    }

    console.log(
      `Product seeder converged ${products.length} products (${created} created, ${updated} updated).`,
    );
  }
}
