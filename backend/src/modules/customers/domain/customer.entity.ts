// Domain Entity - Customer
export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType?: string | null;
  documentNumber?: string | null;
  address: string;
  city: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryInfo {
  fullName: string;
  email: string;
  phone: string;
  documentType?: string;
  documentNumber?: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface CustomerWithDelivery extends Customer {
  deliveryInfo: DeliveryInfo;
}
