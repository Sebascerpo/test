export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Delivery {
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

export interface DeliveryCreateInput {
  transactionId: string;
  transactionReference: string;
  productId: string;
  customerId: string;
  addressSnapshot: string;
  citySnapshot: string;
  postalCodeSnapshot: string;
  status: DeliveryStatus;
  assignedAt?: Date;
}
