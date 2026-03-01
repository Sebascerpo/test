// Port - Product Repository Interface (Hexagonal Architecture)
import { Product } from '../../domain/product.entity';

export abstract class ProductRepositoryPort {
  abstract findAll(): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | null>;
  abstract updateStock(productId: string, quantity: number): Promise<void>;
}
