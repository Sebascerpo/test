// Use Case: Get All Products
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import { Product } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../ports/product.repository.port';

export type GetAllProductsUseCase = () => ResultAsync<Product[]>;

export const createGetAllProductsUseCase = (
  productRepository: ProductRepositoryPort
): GetAllProductsUseCase => {
  return async () => {
    try {
      const products = await productRepository.findAll();
      return ok(products);
    } catch (error) {
      return err(new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};
