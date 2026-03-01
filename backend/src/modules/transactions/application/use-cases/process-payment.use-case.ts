// Use Case: Process Payment (Main Flow - ROP)
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { ProductRepositoryPort } from '../../../products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/application/ports/customer.repository.port';
import {
  PaymentGatewayPort,
  CardTokenizationInput,
} from '../../../payment/application/ports/payment-gateway.port';
import { DeliveryInfo } from '../../../customers/domain/customer.entity';

export interface ProcessPaymentInput {
  productId: string;
  quantity: number;
  deliveryInfo: DeliveryInfo;
  cardInfo: CardTokenizationInput;
}

export interface ProcessPaymentResult {
  transaction: Transaction;
  message: string;
}

export type ProcessPaymentUseCase = (
  input: ProcessPaymentInput,
) => ResultAsync<ProcessPaymentResult>;

// Helper to calculate fees
const calculateFees = (amount: number, quantity: number) => {
  const baseAmount = amount * quantity;
  const baseFee = 2500; // COP $2,500 base fee
  const deliveryFee = 5000; // COP $5,000 delivery fee
  const totalAmount = baseAmount + baseFee + deliveryFee;
  return { baseAmount, baseFee, deliveryFee, totalAmount };
};

import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/adapters/product.orm-entity';
import { CustomerOrmEntity } from '../../../customers/infrastructure/adapters/customer.orm-entity';
import { TransactionOrmEntity } from '../../infrastructure/adapters/transaction.orm-entity';

export const createProcessPaymentUseCase = (
  transactionRepository: TransactionRepositoryPort,
  productRepository: ProductRepositoryPort,
  customerRepository: CustomerRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  dataSource: DataSource,
): ProcessPaymentUseCase => {
  return async (input: ProcessPaymentInput) => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Validate product availability with pessimistic locking
      const productEntity = await queryRunner.manager.findOne(
        ProductOrmEntity,
        {
          where: { id: input.productId },
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (!productEntity) {
        await queryRunner.rollbackTransaction();
        return err(new Error('Product not found'));
      }

      if (productEntity.stock < input.quantity) {
        await queryRunner.rollbackTransaction();
        return err(new Error('Insufficient stock'));
      }

      const fees = calculateFees(productEntity.price, input.quantity);

      // Step 2: Create or get customer
      let customerEntity = await queryRunner.manager.findOne(
        CustomerOrmEntity,
        {
          where: { email: input.deliveryInfo.email },
        },
      );

      if (!customerEntity) {
        customerEntity = queryRunner.manager.create(CustomerOrmEntity, {
          fullName: input.deliveryInfo.fullName,
          email: input.deliveryInfo.email,
          phone: input.deliveryInfo.phone,
          address: input.deliveryInfo.address,
          city: input.deliveryInfo.city,
          postalCode: input.deliveryInfo.postalCode,
        });
        customerEntity = await queryRunner.manager.save(customerEntity);
      }

      // Step 3: Create pending transaction
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const reference = `TX-${timestamp}-${random}`;

      let transactionEntity = queryRunner.manager.create(TransactionOrmEntity, {
        reference,
        productId: input.productId,
        customerId: customerEntity.id,
        amount: fees.baseAmount,
        baseFee: fees.baseFee,
        deliveryFee: fees.deliveryFee,
        totalAmount: fees.totalAmount,
        quantity: input.quantity,
        status: TransactionStatus.PENDING,
      });

      transactionEntity = await queryRunner.manager.save(transactionEntity);

      // Step 4: Tokenize card
      const tokenResult = await paymentGateway.tokenizeCard(input.cardInfo);
      if (!tokenResult.success) {
        transactionEntity.status = TransactionStatus.ERROR;
        transactionEntity.errorMessage = tokenResult.error.message;
        await queryRunner.manager.save(transactionEntity);
        await queryRunner.commitTransaction();
        return err(
          new Error(`Tokenization failed: ${tokenResult.error.message}`),
        );
      }

      // Step 5: Create payment source
      const paymentSourceResult = await paymentGateway.createPaymentSource({
        type: 'CARD',
        token: tokenResult.value.token,
        customer_email: customerEntity.email,
        acceptance_token: 'test_token',
      });

      if (!paymentSourceResult.success) {
        transactionEntity.status = TransactionStatus.ERROR;
        transactionEntity.errorMessage = paymentSourceResult.error.message;
        await queryRunner.manager.save(transactionEntity);
        await queryRunner.commitTransaction();
        return err(
          new Error(
            `Failed to create payment source: ${paymentSourceResult.error.message}`,
          ),
        );
      }

      // Step 6: Create External transaction
      const externalTransactionResult = await paymentGateway.createTransaction({
        amount_in_cents: fees.totalAmount,
        currency: 'COP',
        customer_email: customerEntity.email,
        payment_source_id: paymentSourceResult.value.id,
        reference: transactionEntity.reference,
        signature: 'test_signature',
      });

      // Step 7: Final Status Update
      const finalStatus = !externalTransactionResult.success
        ? TransactionStatus.ERROR
        : externalTransactionResult.value.status === 'APPROVED'
          ? TransactionStatus.APPROVED
          : externalTransactionResult.value.status === 'DECLINED'
            ? TransactionStatus.DECLINED
            : TransactionStatus.ERROR;

      transactionEntity.status = finalStatus;
      if (externalTransactionResult.success) {
        transactionEntity.externalTransactionId =
          externalTransactionResult.value.id;
        transactionEntity.externalReference =
          externalTransactionResult.value.reference;
      } else {
        transactionEntity.errorMessage =
          externalTransactionResult.error.message;
      }

      // Update stock if approved
      if (finalStatus === TransactionStatus.APPROVED) {
        productEntity.stock -= input.quantity;
        await queryRunner.manager.save(productEntity);
      }

      await queryRunner.manager.save(transactionEntity);
      await queryRunner.commitTransaction();

      // Map back to domain for response
      const resultTransaction: Transaction = {
        id: transactionEntity.id,
        reference: transactionEntity.reference,
        productId: transactionEntity.productId,
        customerId: transactionEntity.customerId,
        amount: transactionEntity.amount,
        baseFee: transactionEntity.baseFee,
        deliveryFee: transactionEntity.deliveryFee,
        totalAmount: transactionEntity.totalAmount,
        quantity: transactionEntity.quantity,
        status: transactionEntity.status,
        paymentMethod: transactionEntity.paymentMethod,
        externalTransactionId: transactionEntity.externalTransactionId,
        externalReference: transactionEntity.externalReference,
        errorMessage: transactionEntity.errorMessage,
        createdAt: transactionEntity.createdAt,
        updatedAt: transactionEntity.updatedAt,
      };

      return ok({
        transaction: resultTransaction,
        message:
          finalStatus === TransactionStatus.APPROVED
            ? 'Payment successful!'
            : 'Payment processed',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return err(
        new Error(
          `Payment process failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        ),
      );
    } finally {
      await queryRunner.release();
    }
  };
};
