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

    const initResult = await paymentCoordinator.initializePendingPayment({
      reference: input.reference,
      productId: input.productId,
      quantity: input.quantity,
      deliveryInfo: input.deliveryInfo,
      baseFee: paymentConfig.baseFee,
      deliveryFee: paymentConfig.deliveryFee,
    });
    if (!initResult.success) return err(initResult.error);

    const pendingTransaction = initResult.value.transaction;
    const customerEmail = initResult.value.customerEmail;
    const amountInCents = Math.round(pendingTransaction.totalAmount * 100);

    let finalStatus: TransactionStatus = TransactionStatus.PENDING;
    let externalTransactionId: string | undefined;
    let externalReference: string | undefined;
    let errorMessage: string | undefined;

    const tokenResult = await paymentGateway.tokenizeCard(input.cardInfo);
    if (!tokenResult.success) {
      finalStatus = TransactionStatus.ERROR;
      errorMessage = `Tokenization failed: ${tokenResult.error.message}`;
    } else {
      const acceptanceTokenResult = await paymentGateway.getAcceptanceToken();
      if (!acceptanceTokenResult.success) {
        finalStatus = TransactionStatus.ERROR;
        errorMessage = `Failed to get acceptance token: ${acceptanceTokenResult.error.message}`;
      } else {
        const paymentSourceResult = await paymentGateway.createPaymentSource({
          type: 'CARD',
          token: tokenResult.value.token,
          customer_email: customerEmail,
          acceptance_token: acceptanceTokenResult.value,
        });
        if (!paymentSourceResult.success) {
          finalStatus = TransactionStatus.ERROR;
          errorMessage = `Failed to create payment source: ${paymentSourceResult.error.message}`;
        } else {
          const signature = paymentGateway.generateSignature(
            pendingTransaction.reference,
            amountInCents,
          );
          const externalResult = await paymentGateway.createTransaction({
            amount_in_cents: amountInCents,
            currency: paymentConfig.currency,
            customer_email: customerEmail,
            payment_source_id: paymentSourceResult.value.id,
            reference: pendingTransaction.reference,
            signature,
            installments: 1,
          });

          if (!externalResult.success) {
            finalStatus = TransactionStatus.ERROR;
            errorMessage = externalResult.error.message;
          } else {
            externalTransactionId = externalResult.value.id;
            externalReference = externalResult.value.reference;
            switch (externalResult.value.status) {
              case 'APPROVED':
                finalStatus = TransactionStatus.APPROVED;
                break;
              case 'DECLINED':
                finalStatus = TransactionStatus.DECLINED;
                break;
              case 'PENDING':
                finalStatus = TransactionStatus.PENDING;
                break;
              default:
                finalStatus = TransactionStatus.ERROR;
                break;
            }
          }
        }
      }
    }

    const finalizeResult = await paymentCoordinator.finalizePayment({
      transactionId: pendingTransaction.id,
      status: finalStatus,
      externalTransactionId,
      externalReference,
      errorMessage,
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
