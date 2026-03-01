// Use Case: Update Product Stock
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import { Product } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../ports/product.repository.port';

export interface UpdateStockInput {
  productId: string;
  quantity: number;
}

export type UpdateStockUseCase = (
  input: UpdateStockInput,
) => ResultAsync<Product>;

export const createUpdateStockUseCase = (
  productRepository: ProductRepositoryPort,
): UpdateStockUseCase => {
  return async (input: UpdateStockInput) => {
    try {
      // Step 1: Validate product existence
      const product = await productRepository.findById(input.productId);
      if (!product) {
        return err(new Error('Product not found'));
      }

      // Step 2: Validate stock
      if (product.stock + input.quantity < 0) {
        return err(new Error('Insufficient stock'));
      }

      // Step 3: Update stock
      await productRepository.updateStock(input.productId, input.quantity);

      // Map to response (dummy since we don't have the updated product back from port)
      const updatedProduct: Product = {
        ...product,
        stock: product.stock + input.quantity,
        updatedAt: new Date(),
      };

      return ok(updatedProduct);
    } catch (error) {
      return err(
        new Error(
          `Failed to update stock: ${error instanceof Error ? error.message : 'Unknown'}`,
        ),
      );
    }
  };
};
