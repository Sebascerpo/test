// Use Case: Sync Transaction Status with Wompi
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { PaymentGatewayPort } from '../../../payment/application/ports/payment-gateway.port';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/adapters/product.orm-entity';
import { TransactionOrmEntity } from '../../infrastructure/adapters/transaction.orm-entity';

export interface SyncTransactionStatusResult {
  transaction: Transaction;
  updated: boolean;
}

export type SyncTransactionStatusUseCase = (
  transactionIdOrReference: string,
) => ResultAsync<SyncTransactionStatusResult>;

export const createSyncTransactionStatusUseCase = (
  transactionRepository: TransactionRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  dataSource: DataSource,
): SyncTransactionStatusUseCase => {
  return async (
    idOrReference: string,
  ): ResultAsync<SyncTransactionStatusResult> => {
    try {
      // 1. Find transaction (try by reference first, then id)
      let transaction =
        await transactionRepository.findByReference(idOrReference);

      if (!transaction) {
        // Only try findById if it looks like a UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(idOrReference)) {
          transaction = await transactionRepository.findById(idOrReference);
        }
      }

      if (!transaction) {
        console.warn(`[SYNC] Transaction not found for: ${idOrReference}`);
        return err(new Error('Transaction not found'));
      }

      // 2. Only sync if PENDING and has external ID
      if (
        transaction.status !== TransactionStatus.PENDING ||
        !transaction.externalTransactionId
      ) {
        return ok({ transaction, updated: false });
      }

      // 3. Get latest status from Wompi
      const externalStatusResult = await paymentGateway.getTransactionStatus(
        transaction.externalTransactionId,
      );

      if (!externalStatusResult.success) {
        // If it fails to fetch, we just return the current state
        return ok({ transaction, updated: false });
      }

      const externalStatus = externalStatusResult.value.status;

      // Map Wompi status to our TransactionStatus
      let newStatus: TransactionStatus;
      switch (externalStatus) {
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

      // 4. Update transaction status in DB
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const transactionEntity = await queryRunner.manager.findOne(
          TransactionOrmEntity,
          {
            where: { id: transaction.id },
          },
        );

        if (!transactionEntity) {
          throw new Error('Transaction entity not found in DB');
        }

        transactionEntity.status = newStatus;
        await queryRunner.manager.save(transactionEntity);

        // 5. If APPROVED, decrement stock
        if (newStatus === TransactionStatus.APPROVED) {
          const productEntity = await queryRunner.manager.findOne(
            ProductOrmEntity,
            {
              where: { id: transaction.productId },
            },
          );
          if (productEntity) {
            productEntity.stock -= transaction.quantity;
            await queryRunner.manager.save(productEntity);
          }
        }

        await queryRunner.commitTransaction();

        // Update the original object for response
        transaction.status = newStatus;

        console.log(
          `[SYNC] Transaction ${transaction.reference} updated to ${newStatus}`,
        );

        return ok({ transaction, updated: true });
      } catch (e: unknown) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        const msg = e instanceof Error ? e.message : String(e);
        return err(new Error(`Sync update failed: ${msg}`));
      } finally {
        await queryRunner.release();
      }
    } catch (e: any) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  };
};
