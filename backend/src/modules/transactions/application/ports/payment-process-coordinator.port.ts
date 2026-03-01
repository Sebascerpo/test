import { ResultAsync } from '../../../../shared/common/rop';
import { DeliveryInfo } from '../../../customers/domain/customer.entity';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';

export interface InitializePendingPaymentInput {
  reference?: string;
  productId: string;
  quantity: number;
  deliveryInfo: DeliveryInfo;
  baseFee: number;
  deliveryFee: number;
}

export interface InitializePendingPaymentResult {
  transaction: Transaction;
  customerEmail: string;
}

export interface FinalizePaymentInput {
  transactionId: string;
  status: TransactionStatus;
  externalTransactionId?: string;
  externalReference?: string;
  errorMessage?: string;
}

export interface FinalizePaymentResult {
  transaction: Transaction;
  deliveryId?: string;
  stockUpdated: boolean;
}

export abstract class PaymentProcessCoordinatorPort {
  abstract initializePendingPayment(
    input: InitializePendingPaymentInput,
  ): ResultAsync<InitializePendingPaymentResult>;

  abstract finalizePayment(
    input: FinalizePaymentInput,
  ): ResultAsync<FinalizePaymentResult>;
}
