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

export const createSyncTransactionStatusUseCase = (
  transactionRepository: TransactionRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  paymentCoordinator: PaymentProcessCoordinatorPort,
): SyncTransactionStatusUseCase => {
  return async (
    idOrReference: string,
  ): ResultAsync<SyncTransactionStatusResult> => {
    try {
      let transaction = await transactionRepository.findByReference(idOrReference);
      if (!transaction) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(idOrReference)) {
          transaction = await transactionRepository.findById(idOrReference);
        }
      }

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

      let newStatus: TransactionStatus;
      switch (externalStatusResult.value.status) {
        case 'APPROVED':
          newStatus = TransactionStatus.APPROVED;
          break;
        case 'DECLINED':
          newStatus = TransactionStatus.DECLINED;
          break;
        case 'PENDING':
          newStatus = TransactionStatus.PENDING;
          break;
        default:
          newStatus = TransactionStatus.ERROR;
          break;
      }

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
