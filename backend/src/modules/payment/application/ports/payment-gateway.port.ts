// Port - Payment Gateway Interface
import { ResultAsync } from '../../../../shared/common/rop';

export interface CardTokenizationInput {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface CardTokenizationResult {
  token: string;
  last_four: string;
}

export interface PaymentSourceInput {
  type: 'CARD' | 'NEQUI';
  token?: string;
  customer_email: string;
  acceptance_token: string;
}

export interface PaymentSourceResult {
  id: string;
}

export interface TransactionInput {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_source_id: string;
  reference: string;
  signature: string;
}

export interface TransactionResult {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  reference: string;
}

export abstract class PaymentGatewayPort {
  abstract tokenizeCard(
    input: CardTokenizationInput,
  ): ResultAsync<CardTokenizationResult>;
  abstract createPaymentSource(
    input: PaymentSourceInput,
  ): ResultAsync<PaymentSourceResult>;
  abstract createTransaction(
    input: TransactionInput,
  ): ResultAsync<TransactionResult>;
  abstract getTransactionStatus(id: string): ResultAsync<TransactionResult>;
  abstract getAcceptanceToken(): ResultAsync<string>;
}

// Payment Gateway Configuration
export class PaymentConfig {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  integrityKey: string;
}
