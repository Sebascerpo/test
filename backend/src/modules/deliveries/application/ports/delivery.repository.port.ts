import {
  Delivery,
  DeliveryCreateInput,
  DeliveryStatus,
} from '../../domain/delivery.entity';

export abstract class DeliveryRepositoryPort {
  abstract create(input: DeliveryCreateInput): Promise<Delivery>;
  abstract findById(id: string): Promise<Delivery | null>;
  abstract findByTransactionId(transactionId: string): Promise<Delivery | null>;
  abstract findByTransactionReference(
    transactionReference: string,
  ): Promise<Delivery | null>;
  abstract updateStatus(
    id: string,
    status: DeliveryStatus,
    deliveredAt?: Date | null,
  ): Promise<Delivery | null>;
}
