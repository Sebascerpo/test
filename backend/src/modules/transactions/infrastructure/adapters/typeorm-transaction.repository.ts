import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepositoryPort } from '../../application/ports/transaction.repository.port';
import {
  Transaction,
  TransactionStatus,
  TransactionCreateInput,
} from '../../domain/transaction.entity';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  async create(input: TransactionCreateInput): Promise<Transaction> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `TX-${timestamp}-${random}`;

    const transaction = this.repository.create({
      reference,
      productId: input.productId,
      customerId: input.customerId,
      amount: input.amount,
      baseFee: input.baseFee,
      deliveryFee: input.deliveryFee,
      totalAmount: input.amount + input.baseFee + input.deliveryFee,
      quantity: input.quantity,
      status: TransactionStatus.PENDING,
    });

    const saved = await this.repository.save(transaction);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.repository.findOne({ where: { id } });
    return transaction ? this.toDomain(transaction) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const transaction = await this.repository.findOne({ where: { reference } });
    return transaction ? this.toDomain(transaction) : null;
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    externalData?: {
      externalTransactionId?: string;
      externalReference?: string;
      errorMessage?: string;
    },
  ): Promise<Transaction | null> {
    const transaction = await this.repository.findOne({ where: { id } });
    if (!transaction) return null;

    transaction.status = status;
    if (externalData?.externalTransactionId) {
      transaction.externalTransactionId = externalData.externalTransactionId;
    }
    if (externalData?.externalReference) {
      transaction.externalReference = externalData.externalReference;
    }
    if (externalData?.errorMessage) {
      transaction.errorMessage = externalData.errorMessage;
    }

    const saved = await this.repository.save(transaction);
    return this.toDomain(saved);
  }

  async findAll(): Promise<Transaction[]> {
    const transactions = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return transactions.map(this.toDomain);
  }

  private toDomain(entity: TransactionOrmEntity): Transaction {
    return {
      id: entity.id,
      reference: entity.reference,
      productId: entity.productId,
      customerId: entity.customerId,
      quantity: entity.quantity,
      amount: entity.amount,
      baseFee: entity.baseFee,
      deliveryFee: entity.deliveryFee,
      totalAmount: entity.totalAmount,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      externalTransactionId: entity.externalTransactionId,
      externalReference: entity.externalReference,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
