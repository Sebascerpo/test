import { Injectable } from '@nestjs/common';
import {
  Delivery,
  DeliveryCreateInput,
  DeliveryStatus,
} from '../../domain/delivery.entity';
import { DeliveryRepositoryPort } from '../../application/ports/delivery.repository.port';
import { v4 as uuidv4 } from 'uuid';

const deliveries = new Map<string, Delivery>();
const transactionIdIndex = new Map<string, string>();
const transactionReferenceIndex = new Map<string, string>();

@Injectable()
export class InMemoryDeliveryRepository implements DeliveryRepositoryPort {
  async create(input: DeliveryCreateInput): Promise<Delivery> {
    const id = uuidv4();
    const now = new Date();
    const delivery: Delivery = {
      id,
      transactionId: input.transactionId,
      transactionReference: input.transactionReference,
      productId: input.productId,
      customerId: input.customerId,
      addressSnapshot: input.addressSnapshot,
      citySnapshot: input.citySnapshot,
      postalCodeSnapshot: input.postalCodeSnapshot,
      status: input.status,
      assignedAt: input.assignedAt ?? now,
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
    };

    deliveries.set(id, delivery);
    transactionIdIndex.set(input.transactionId, id);
    transactionReferenceIndex.set(input.transactionReference, id);
    return { ...delivery };
  }

  async findById(id: string): Promise<Delivery | null> {
    const delivery = deliveries.get(id);
    return delivery ? { ...delivery } : null;
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    const id = transactionIdIndex.get(transactionId);
    if (!id) return null;
    return this.findById(id);
  }

  async findByTransactionReference(
    transactionReference: string,
  ): Promise<Delivery | null> {
    const id = transactionReferenceIndex.get(transactionReference);
    if (!id) return null;
    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    deliveredAt?: Date | null,
  ): Promise<Delivery | null> {
    const delivery = deliveries.get(id);
    if (!delivery) return null;

    const updated: Delivery = {
      ...delivery,
      status,
      deliveredAt:
        typeof deliveredAt !== 'undefined'
          ? deliveredAt
          : status === DeliveryStatus.DELIVERED
            ? new Date()
            : delivery.deliveredAt,
      updatedAt: new Date(),
    };
    deliveries.set(id, updated);
    return { ...updated };
  }

  reset(): void {
    deliveries.clear();
    transactionIdIndex.clear();
    transactionReferenceIndex.clear();
  }
}
