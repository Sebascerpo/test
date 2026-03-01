// Infrastructure Adapter - In-Memory Customer Repository
import { Customer, DeliveryInfo } from '../../domain/customer.entity';
import { CustomerRepositoryPort } from '../../application/ports/customer.repository.port';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage
const customers: Map<string, Customer> = new Map();
const emailIndex: Map<string, string> = new Map();

import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryCustomerRepository implements CustomerRepositoryPort {
  async create(deliveryInfo: DeliveryInfo): Promise<Customer> {
    const id = uuidv4();
    const now = new Date();

    const customer: Customer = {
      id,
      fullName: deliveryInfo.fullName,
      email: deliveryInfo.email,
      phone: deliveryInfo.phone,
      documentType: deliveryInfo.documentType ?? null,
      documentNumber: deliveryInfo.documentNumber ?? null,
      address: deliveryInfo.address,
      city: deliveryInfo.city,
      postalCode: deliveryInfo.postalCode,
      createdAt: now,
      updatedAt: now,
    };

    customers.set(id, customer);
    emailIndex.set(deliveryInfo.email.toLowerCase(), id);

    return { ...customer };
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = customers.get(id);
    return customer ? { ...customer } : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const id = emailIndex.get(email.toLowerCase());
    if (!id) return null;
    return this.findById(id);
  }

  // Reset for testing
  reset(): void {
    customers.clear();
    emailIndex.clear();
  }
}
