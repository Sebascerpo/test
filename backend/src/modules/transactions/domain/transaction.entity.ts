// Domain Entity - Transaction
export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
}

export interface Transaction {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  quantity: number;
  totalAmount: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  externalTransactionId?: string;
  externalReference?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreateInput {
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  quantity: number;
}

export interface TransactionResult {
  success: boolean;
  transaction: Transaction;
  message?: string;
}
