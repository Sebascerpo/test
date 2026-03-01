// Use Case: Process Payment (Main Flow - ROP)
import { ResultAsync, ok, err } from '../../../../shared/common/rop';
import {
  Transaction,
  TransactionStatus,
  PaymentMethod,
} from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { ProductRepositoryPort } from '../../../products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/application/ports/customer.repository.port';
import {
  PaymentGatewayPort,
  CardTokenizationInput,
  PaymentConfig,
} from '../../../payment/application/ports/payment-gateway.port';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/adapters/product.orm-entity';
import { CustomerOrmEntity } from '../../../customers/infrastructure/adapters/customer.orm-entity';
import { TransactionOrmEntity } from '../../infrastructure/adapters/transaction.orm-entity';

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
  message: string;
}

export type ProcessPaymentUseCase = (
  input: ProcessPaymentInput,
) => ResultAsync<ProcessPaymentResult>;

// Helper to calculate fees
const calculateFees = (
  amount: number,
  quantity: number,
  baseFee: number,
  deliveryFee: number,
) => {
  const baseAmount = amount * quantity;
  const totalAmount = baseAmount + baseFee + deliveryFee;
  return { baseAmount, baseFee, deliveryFee, totalAmount };
};

export const createProcessPaymentUseCase = (
  transactionRepository: TransactionRepositoryPort,
  productRepository: ProductRepositoryPort,
  customerRepository: CustomerRepositoryPort,
  paymentGateway: PaymentGatewayPort,
  paymentConfig: PaymentConfig,
  dataSource: DataSource,
): ProcessPaymentUseCase => {
  return async (
    input: ProcessPaymentInput,
  ): ResultAsync<ProcessPaymentResult> => {
    if (input.reference) {
      const existingTransaction = await transactionRepository.findByReference(
        input.reference,
      );
      if (existingTransaction) {
        return ok({
          transaction: existingTransaction,
          message: 'Transaction already exists for this payment attempt',
        });
      }
    }

    const setupRunner = dataSource.createQueryRunner();
    await setupRunner.connect();

    let transactionEntity: TransactionOrmEntity | null = null;
    let customerEmail = input.deliveryInfo.email;
    let amountInCents = 0;

    try {
      await setupRunner.startTransaction();

      // Step 1: Validate product and create local PENDING as fast as possible.
      const productEntity = await setupRunner.manager.findOne(ProductOrmEntity, {
        where: { id: input.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!productEntity) {
        await setupRunner.rollbackTransaction();
        return err(new Error('Product not found'));
      }

      if (productEntity.stock < input.quantity) {
        await setupRunner.rollbackTransaction();
        return err(new Error('Insufficient stock'));
      }

      const fees = calculateFees(
        productEntity.price,
        input.quantity,
        paymentConfig.baseFee,
        paymentConfig.deliveryFee,
      );
      amountInCents = Math.round(fees.totalAmount * 100);

      let customerEntity = await setupRunner.manager.findOne(CustomerOrmEntity, {
        where: { email: input.deliveryInfo.email },
      });
      if (!customerEntity) {
        customerEntity = setupRunner.manager.create(CustomerOrmEntity, {
          fullName: input.deliveryInfo.fullName,
          email: input.deliveryInfo.email,
          phone: input.deliveryInfo.phone,
          address: input.deliveryInfo.address,
          city: input.deliveryInfo.city,
          postalCode: input.deliveryInfo.postalCode,
        });
        customerEntity = await setupRunner.manager.save(customerEntity);
      }

      customerEmail = customerEntity.email;

      const reference =
        input.reference ??
        `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      transactionEntity = setupRunner.manager.create(TransactionOrmEntity, {
        reference,
        productId: input.productId,
        customerId: customerEntity.id,
        amount: fees.baseAmount,
        baseFee: fees.baseFee,
        deliveryFee: fees.deliveryFee,
        totalAmount: fees.totalAmount,
        quantity: input.quantity,
        status: TransactionStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      });
      transactionEntity = await setupRunner.manager.save(transactionEntity);

      // Important: commit now so /sync can see the transaction immediately.
      await setupRunner.commitTransaction();
    } catch (error: unknown) {
      if (setupRunner.isTransactionActive) {
        await setupRunner.rollbackTransaction();
      }

      const dbError = error as { code?: string };
      if (dbError.code === '23505' && input.reference) {
        const existingTransaction = await transactionRepository.findByReference(
          input.reference,
        );
        if (existingTransaction) {
          return ok({
            transaction: existingTransaction,
            message: 'Transaction already exists for this payment attempt',
          });
        }
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      return err(new Error(`Payment process failed: ${msg}`));
    } finally {
      await setupRunner.release();
    }

    if (!transactionEntity) {
      return err(new Error('Failed to initialize pending transaction'));
    }

    // Step 2: External payment flow outside DB transaction.
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
            transactionEntity.reference,
            amountInCents,
          );
          const externalTransactionResult =
            await paymentGateway.createTransaction({
              amount_in_cents: amountInCents,
              currency: paymentConfig.currency,
              customer_email: customerEmail,
              payment_source_id: paymentSourceResult.value.id,
              reference: transactionEntity.reference,
              signature,
              installments: 1,
            });

          if (!externalTransactionResult.success) {
            finalStatus = TransactionStatus.ERROR;
            errorMessage = externalTransactionResult.error.message;
          } else {
            externalTransactionId = externalTransactionResult.value.id;
            externalReference = externalTransactionResult.value.reference;
            switch (externalTransactionResult.value.status as any) {
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

    // Step 3: Persist final state in a short transaction.
    const finalizeRunner = dataSource.createQueryRunner();
    await finalizeRunner.connect();
    try {
      await finalizeRunner.startTransaction();
      const txToUpdate = await finalizeRunner.manager.findOne(
        TransactionOrmEntity,
        {
          where: { id: transactionEntity.id },
        },
      );

      if (!txToUpdate) {
        throw new Error('Transaction entity not found in DB');
      }

      txToUpdate.status = finalStatus;
      txToUpdate.externalTransactionId =
        (externalTransactionId ?? null) as unknown as string;
      txToUpdate.externalReference =
        (externalReference ?? null) as unknown as string;
      txToUpdate.errorMessage = (errorMessage ?? null) as unknown as string;

      if (finalStatus === TransactionStatus.APPROVED) {
        const productToUpdate = await finalizeRunner.manager.findOne(
          ProductOrmEntity,
          {
            where: { id: txToUpdate.productId },
            lock: { mode: 'pessimistic_write' },
          },
        );
        if (productToUpdate && productToUpdate.stock >= txToUpdate.quantity) {
          productToUpdate.stock -= txToUpdate.quantity;
          await finalizeRunner.manager.save(productToUpdate);
        }
      }

      const savedTx = await finalizeRunner.manager.save(txToUpdate);
      await finalizeRunner.commitTransaction();

      const resultTransaction: Transaction = {
        id: savedTx.id,
        reference: savedTx.reference,
        productId: savedTx.productId,
        customerId: savedTx.customerId,
        amount: savedTx.amount,
        baseFee: savedTx.baseFee,
        deliveryFee: savedTx.deliveryFee,
        totalAmount: savedTx.totalAmount,
        quantity: savedTx.quantity,
        status: savedTx.status,
        paymentMethod: savedTx.paymentMethod,
        externalTransactionId: savedTx.externalTransactionId,
        externalReference: savedTx.externalReference,
        errorMessage: savedTx.errorMessage,
        createdAt: savedTx.createdAt,
        updatedAt: savedTx.updatedAt,
      };

      return ok({
        transaction: resultTransaction,
        message:
          finalStatus === TransactionStatus.APPROVED
            ? 'Payment successful!'
            : 'Payment processed',
      });
    } catch (error: unknown) {
      if (finalizeRunner.isTransactionActive) {
        await finalizeRunner.rollbackTransaction();
      }
      const msg = error instanceof Error ? error.message : 'Unknown';
      return err(new Error(`Payment finalization failed: ${msg}`));
    } finally {
      await finalizeRunner.release();
    }
  };
};
