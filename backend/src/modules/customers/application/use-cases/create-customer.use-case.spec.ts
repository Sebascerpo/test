import { createCustomerUseCase } from './create-customer.use-case';

describe('create-customer.use-case', () => {
  const payload = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '3000000000',
    address: 'Main St 123',
    city: 'Bogota',
    postalCode: '110111',
  };

  it('returns existing customer when email already exists', async () => {
    const repository: any = {
      findByEmail: jest.fn().mockResolvedValue({ id: 'c-1', ...payload }),
      create: jest.fn(),
    };

    const useCase = createCustomerUseCase(repository);
    const result = await useCase(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('c-1');
    }
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates customer when email does not exist', async () => {
    const repository: any = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'c-2', ...payload }),
    };

    const useCase = createCustomerUseCase(repository);
    const result = await useCase(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('c-2');
    }
  });

  it('fails when required information is missing', async () => {
    const repository: any = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const useCase = createCustomerUseCase(repository);
    const result = await useCase({
      ...payload,
      fullName: '',
    });

    expect(result.success).toBe(false);
  });

  it('returns wrapped error when repository throws', async () => {
    const repository: any = {
      findByEmail: jest.fn().mockRejectedValue('db down'),
      create: jest.fn(),
    };

    const useCase = createCustomerUseCase(repository);
    const result = await useCase(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Unknown error');
    }
  });
});
