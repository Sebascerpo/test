// Use Case: Create Customer
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import { Customer, DeliveryInfo } from '../../domain/customer.entity';
import { CustomerRepositoryPort } from '../ports/customer.repository.port';

export type CreateCustomerUseCase = (
  deliveryInfo: DeliveryInfo,
) => ResultAsync<Customer>;

export const createCustomerUseCase = (
  customerRepository: CustomerRepositoryPort,
): CreateCustomerUseCase => {
  return async (deliveryInfo: DeliveryInfo) => {
    try {
      // Validate delivery info
      if (
        !deliveryInfo.fullName ||
        !deliveryInfo.email ||
        !deliveryInfo.address
      ) {
        return err(new Error('Missing required delivery information'));
      }

      // Check if customer exists
      const existingCustomer = await customerRepository.findByEmail(
        deliveryInfo.email,
      );
      if (existingCustomer) {
        return ok(existingCustomer);
      }

      // Create new customer
      const customer = await customerRepository.create(deliveryInfo);
      return ok(customer);
    } catch (error) {
      return err(
        new Error(
          `Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  };
};
