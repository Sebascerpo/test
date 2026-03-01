import { createGetAllProductsUseCase } from './get-all-products.use-case';

describe('get-all-products.use-case', () => {
  it('returns products from repository', async () => {
    const repository: any = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 'p-1', name: 'Product 1', stock: 2 }]),
    };

    const useCase = createGetAllProductsUseCase(repository);
    const result = await useCase();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('returns error when repository throws', async () => {
    const repository: any = {
      findAll: jest.fn().mockRejectedValue(new Error('db failed')),
    };

    const useCase = createGetAllProductsUseCase(repository);
    const result = await useCase();

    expect(result.success).toBe(false);
  });

  it('returns unknown error label when thrown value is not an Error', async () => {
    const repository: any = {
      findAll: jest.fn().mockRejectedValue('failed'),
    };

    const useCase = createGetAllProductsUseCase(repository);
    const result = await useCase();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Unknown error');
    }
  });
});
