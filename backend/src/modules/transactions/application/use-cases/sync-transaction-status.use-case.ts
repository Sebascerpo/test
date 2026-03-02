import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import { PaymentGatewayPort } from '../../../payment/application/ports/payment-gateway.port';
import { PaymentProcessCoordinatorPort } from '../ports/payment-process-coordinator.port';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';

export interface SyncTransactionStatusResult {
  transaction: Transaction | null;
  updated: boolean;
  retryable?: boolean;
  reason?: 'NOT_FOUND_YET';
  deliveryId?: string;
}

export type SyncTransactionStatusUseCase = (
  transactionIdOrReference: string,
) => ResultAsync<SyncTransactionStatusResult>;

const mapExternalStatusToTransactionStatus = (
  externalStatus: string,
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

const findTransactionByIdOrReference = async (
  idOrReference: string,
  transactionRepository: TransactionRepositoryPort,
): Promise<Transaction | null> => {
  let transaction = await transactionRepository.findByReference(idOrReference);
  if (!transaction) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idOrReference)) {
      transaction = await transactionRepository.findById(idOrReference);
    }
  }
  return transaction;
};

export const createSyncTransactionStatusUseCase = (
  transactionRepository: TransactionRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  paymentCoordinator: PaymentProcessCoordinatorPort,
): SyncTransactionStatusUseCase => {
  return async (
    idOrReference: string,
  ): ResultAsync<SyncTransactionStatusResult> => {
    try {
      const transaction = await findTransactionByIdOrReference(
        idOrReference,
        transactionRepository,
      );

      if (!transaction) {
        return ok({
          transaction: null,
          updated: false,
          retryable: true,
          reason: 'NOT_FOUND_YET',
        });
      }

      if (
        transaction.status !== TransactionStatus.PENDING ||
        !transaction.externalTransactionId
      ) {
        return ok({ transaction, updated: false });
      }

      const externalStatusResult = await paymentGateway.getTransactionStatus(
        transaction.externalTransactionId,
      );
      if (!externalStatusResult.success) {
        return ok({ transaction, updated: false });
      }

      const newStatus = mapExternalStatusToTransactionStatus(
        externalStatusResult.value.status,
      );

      if (newStatus === transaction.status) {
        return ok({ transaction, updated: false });
      }

      const finalized = await paymentCoordinator.finalizePayment({
        transactionId: transaction.id,
        status: newStatus,
      });
      if (!finalized.success) return err(finalized.error);

      return ok({
        transaction: finalized.value.transaction,
        updated: true,
        deliveryId: finalized.value.deliveryId,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  };
};
