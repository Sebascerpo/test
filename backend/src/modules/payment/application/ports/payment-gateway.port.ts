// Port - Wompi Gateway Interface
export interface CardTokenizationInput {
  number: string;
  cvv: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface CardTokenizationResult {
  success: boolean;
  tokenId?: string;
  error?: string;
}

export interface PaymentSourceInput {
  tokenId: string;
  customerEmail: string;
  type: 'CARD';
}

export interface PaymentSourceResult {
  success: boolean;
  paymentSourceId?: string;
  error?: string;
}

export interface TransactionInput {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  paymentSourceId: number;
  reference: string;
  paymentDescription: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  status?: 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING';
  reference?: string;
  error?: string;
}

export abstract class WompiGatewayPort {
  abstract tokenizeCard(
    input: CardTokenizationInput,
  ): Promise<CardTokenizationResult>;
  abstract createPaymentSource(
    input: PaymentSourceInput,
  ): Promise<PaymentSourceResult>;
  abstract createTransaction(
    input: TransactionInput,
  ): Promise<TransactionResult>;
  abstract getTransactionStatus(
    transactionId: string,
  ): Promise<TransactionResult>;
}

// Wompi Configuration
export class WompiConfig {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  integrityKey: string;
}
