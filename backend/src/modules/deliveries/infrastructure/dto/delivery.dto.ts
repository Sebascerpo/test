import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../domain/delivery.entity';

export class DeliveryDto {
  id: string;
  transactionId: string;
  transactionReference: string;
  productId: string;
  customerId: string;
  addressSnapshot: string;
  citySnapshot: string;
  postalCodeSnapshot: string;
  status: DeliveryStatus;
  assignedAt: Date;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}
