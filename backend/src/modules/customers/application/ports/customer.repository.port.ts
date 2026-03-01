// Port - Customer Repository Interface
import { Customer, DeliveryInfo } from '../../domain/customer.entity';

export abstract class CustomerRepositoryPort {
  abstract create(deliveryInfo: DeliveryInfo): Promise<Customer>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByEmail(email: string): Promise<Customer | null>;
}
