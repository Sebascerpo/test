import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import {
  CardTokenizationInput,
  PaymentConfig,
  PaymentGatewayPort,
} from '../../../payment/application/ports/payment-gateway.port';
import { PaymentProcessCoordinatorPort } from '../ports/payment-process-coordinator.port';

export interface ProcessPaymentInput {
  reference?: string;
  productId: string;
  quantity: number;
  deliveryInfo: {
    fullName: string;
    email: string;
    phone: string;
    documentType?: string;
    documentNumber?: string;
    address: string;
    city: string;
    postalCode: string;
  };
  cardInfo: CardTokenizationInput;
}

export interface ProcessPaymentResult {
  transaction: Transaction;
  deliveryId?: string;
  message: string;
}

export type ProcessPaymentUseCase = (
  input: ProcessPaymentInput,
) => ResultAsync<ProcessPaymentResult>;

interface PaymentExecutionContext {
  amountInCents: number;
  customerEmail: string;
  pendingReference: string;
  cardInfo: CardTokenizationInput;
}

interface ExternalPaymentOutcome {
  status: TransactionStatus;
  externalTransactionId?: string;
  externalReference?: string;
  errorMessage?: string;
}

const mapExternalStatusToTransactionStatus = (
  externalStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR',
): TransactionStatus => {
  switch (externalStatus) {
    case 'APPROVED':
      return TransactionStatus.APPROVED;
    case 'DECLINED':
      return TransactionStatus.DECLINED;
    case 'PENDING':
      return TransactionStatus.PENDING;
    default:
      return TransactionStatus.ERROR;
  }
};

const buildErrorOutcome = (errorMessage: string): ExternalPaymentOutcome => ({
  status: TransactionStatus.ERROR,
  errorMessage,
});

const resolveExternalPaymentOutcome = async (
  paymentGateway: PaymentGatewayPort,
  paymentConfig: PaymentConfig,
  context: PaymentExecutionContext,
): Promise<ExternalPaymentOutcome> => {
  const tokenResult = await paymentGateway.tokenizeCard(context.cardInfo);
  if (!tokenResult.success) {
    return buildErrorOutcome(
      `Tokenization failed: ${tokenResult.error.message}`,
    );
  }

  const acceptanceTokenResult = await paymentGateway.getAcceptanceToken();
  if (!acceptanceTokenResult.success) {
    return buildErrorOutcome(
      `Failed to get acceptance token: ${acceptanceTokenResult.error.message}`,
    );
  }

  const paymentSourceResult = await paymentGateway.createPaymentSource({
    type: 'CARD',
    token: tokenResult.value.token,
    customer_email: context.customerEmail,
    acceptance_token: acceptanceTokenResult.value,
  });
  if (!paymentSourceResult.success) {
    return buildErrorOutcome(
      `Failed to create payment source: ${paymentSourceResult.error.message}`,
    );
  }

  const signature = paymentGateway.generateSignature(
    context.pendingReference,
    context.amountInCents,
  );
  const externalResult = await paymentGateway.createTransaction({
    amount_in_cents: context.amountInCents,
    currency: paymentConfig.currency,
    customer_email: context.customerEmail,
    payment_source_id: paymentSourceResult.value.id,
    reference: context.pendingReference,
    signature,
    installments: 1,
  });
  if (!externalResult.success) {
    return buildErrorOutcome(externalResult.error.message);
  }

  return {
    status: mapExternalStatusToTransactionStatus(externalResult.value.status),
    externalTransactionId: externalResult.value.id,
    externalReference: externalResult.value.reference,
  };
};

export const createProcessPaymentUseCase = (
  transactionRepository: TransactionRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  paymentConfig: PaymentConfig,
  paymentCoordinator: PaymentProcessCoordinatorPort,
): ProcessPaymentUseCase => {
  return async (
    input: ProcessPaymentInput,
  ): ResultAsync<ProcessPaymentResult> => {
    if (input.reference) {
      const existing = await transactionRepository.findByReference(
        input.reference,
      );
      if (existing) {
        return ok({
          transaction: existing,
          message: 'Transaction already exists for this payment attempt',
        });
      }
    }

    const initializationResult =
      await paymentCoordinator.initializePendingPayment({
        reference: input.reference,
        productId: input.productId,
        quantity: input.quantity,
        deliveryInfo: input.deliveryInfo,
        baseFee: paymentConfig.baseFee,
        deliveryFee: paymentConfig.deliveryFee,
      });
    if (!initializationResult.success) return err(initializationResult.error);

    const pendingTransaction = initializationResult.value.transaction;
    const externalOutcome = await resolveExternalPaymentOutcome(
      paymentGateway,
      paymentConfig,
      {
        amountInCents: Math.round(pendingTransaction.totalAmount * 100),
        customerEmail: initializationResult.value.customerEmail,
        pendingReference: pendingTransaction.reference,
        cardInfo: input.cardInfo,
      },
    );

    const finalizeResult = await paymentCoordinator.finalizePayment({
      transactionId: pendingTransaction.id,
      status: externalOutcome.status,
      externalTransactionId: externalOutcome.externalTransactionId,
      externalReference: externalOutcome.externalReference,
      errorMessage: externalOutcome.errorMessage,
    });
    if (!finalizeResult.success) return err(finalizeResult.error);

    return ok({
      transaction: finalizeResult.value.transaction,
      deliveryId: finalizeResult.value.deliveryId,
      message:
        finalizeResult.value.transaction.status === TransactionStatus.APPROVED
          ? 'Payment successful!'
          : 'Payment processed',
    });
  };
};
