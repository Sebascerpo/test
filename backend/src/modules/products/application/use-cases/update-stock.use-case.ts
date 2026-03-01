// Use Case: Update Product Stock
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import { Product, ProductStock } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../ports/product.repository.port';

export interface UpdateStockInput {
  productId: string;
  quantity: number;
}

export type UpdateStockUseCase = (input: UpdateStockInput) => ResultAsync<Product>;

export const createUpdateStockUseCase = (
  productRepository: ProductRepositoryPort
): UpdateStockUseCase => {
  return async (input: UpdateStockInput) => {
    try {
      // Check availability first
      const isAvailable = await productRepository.checkAvailability(input.productId, input.quantity);
      if (!isAvailable) {
        return err(new Error('Insufficient stock'));
      }

      // Update stock (negative quantity for decrement)
      const product = await productRepository.updateStock(input.productId, -input.quantity);
      if (!product) {
        return err(new Error('Product not found'));
      }

      return ok(product);
    } catch (error) {
      return err(new Error(`Failed to update stock: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};
