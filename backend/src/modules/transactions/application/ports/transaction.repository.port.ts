// Port - Transaction Repository Interface
import {
  Transaction,
  TransactionCreateInput,
  TransactionStatus,
} from '../../domain/transaction.entity';

export abstract class TransactionRepositoryPort {
  abstract create(input: TransactionCreateInput): Promise<Transaction>;
  abstract findById(id: string): Promise<Transaction | null>;
  abstract findByReference(reference: string): Promise<Transaction | null>;
  abstract updateStatus(
    id: string,
    status: TransactionStatus,
    externalData?: {
      externalTransactionId?: string;
      externalReference?: string;
      errorMessage?: string;
    },
  ): Promise<Transaction | null>;
  abstract findAll(): Promise<Transaction[]>;
}
