// Infrastructure Adapter - In-Memory Transaction Repository
import {
  Transaction,
  TransactionStatus,
  TransactionCreateInput,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../../application/ports/transaction.repository.port';
import { v4 as uuidv4 } from 'uuid';

// Generate reference number
const generateReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WMP-${timestamp}-${random}`;
};

// In-memory storage
const transactions: Map<string, Transaction> = new Map();
const referenceIndex: Map<string, string> = new Map();

import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryTransactionRepository implements TransactionRepositoryPort {
  async create(input: TransactionCreateInput): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date();
    const reference = generateReference();

    const transaction: Transaction = {
      id,
      reference,
      productId: input.productId,
      customerId: input.customerId,
      amount: input.amount,
      baseFee: input.baseFee,
      deliveryFee: input.deliveryFee,
      totalAmount: input.amount + input.baseFee + input.deliveryFee,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: now,
      updatedAt: now,
    };

    transactions.set(id, transaction);
    referenceIndex.set(reference, id);

    return { ...transaction };
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = transactions.get(id);
    return transaction ? { ...transaction } : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const id = referenceIndex.get(reference);
    if (!id) return null;
    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    wompiData?: {
      wompiTransactionId?: string;
      wompiReference?: string;
      errorMessage?: string;
    },
  ): Promise<Transaction | null> {
    const transaction = transactions.get(id);
    if (!transaction) return null;

    const updated: Transaction = {
      ...transaction,
      status,
      updatedAt: new Date(),
      ...(wompiData?.wompiTransactionId && {
        wompiTransactionId: wompiData.wompiTransactionId,
      }),
      ...(wompiData?.wompiReference && {
        wompiReference: wompiData.wompiReference,
      }),
      ...(wompiData?.errorMessage && { errorMessage: wompiData.errorMessage }),
    };

    transactions.set(id, updated);
    return { ...updated };
  }

  async findAll(): Promise<Transaction[]> {
    return Array.from(transactions.values()).map((t) => ({ ...t }));
  }

  // Reset for testing
  reset(): void {
    transactions.clear();
    referenceIndex.clear();
  }
}
