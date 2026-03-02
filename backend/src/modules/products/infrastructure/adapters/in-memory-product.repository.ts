// Infrastructure Adapter - In-Memory Product Repository
import { Product } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';

// Seed data for products
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description:
      'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 149990,
    stock: 15,
    imageUrl: '/products/headphones.jpg',
    category: 'Electronics',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    description:
      'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
    price: 299990,
    stock: 8,
    imageUrl: '/products/smartwatch.jpg',
    category: 'Electronics',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Mechanical Keyboard',
    description:
      'RGB mechanical keyboard with Cherry MX switches and programmable keys.',
    price: 179990,
    stock: 12,
    imageUrl: '/products/keyboard.jpg',
    category: 'Accessories',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Wireless Mouse',
    description:
      'Ergonomic wireless mouse with adjustable DPI and silent clicks.',
    price: 79990,
    stock: 25,
    imageUrl: '/products/mouse.jpg',
    category: 'Accessories',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Fast Charger 65W',
    description:
      'Universal fast charger compatible with laptops, phones, and tablets.',
    price: 59990,
    stock: 30,
    imageUrl: '/products/charger.jpg',
    category: 'Accessories',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// In-memory storage
let products: Product[] = [...initialProducts];

import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryProductRepository implements ProductRepositoryPort {
  findAll(): Promise<Product[]> {
    return Promise.resolve([...products]);
  }

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(products.find((p) => p.id === id) || null);
  }

  updateStock(productId: string, quantityChange: number): Promise<void> {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const newStock = product.stock + quantityChange;
      product.stock = newStock;
      product.updatedAt = new Date();
    }
    return Promise.resolve();
  }

  // Reset for testing
  reset(): void {
    products = [...initialProducts];
  }
}
