import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ok, err, ResultAsync } from '../../../../shared/common/rop';
import { CustomerOrmEntity } from '../../../customers/infrastructure/adapters/customer.orm-entity';
import { DeliveryStatus } from '../../../deliveries/domain/delivery.entity';
import { DeliveryOrmEntity } from '../../../deliveries/infrastructure/adapters/delivery.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/adapters/product.orm-entity';
import {
  FinalizePaymentInput,
  FinalizePaymentResult,
  InitializePendingPaymentInput,
  InitializePendingPaymentResult,
  PaymentProcessCoordinatorPort,
} from '../../application/ports/payment-process-coordinator.port';
import {
  PaymentMethod,
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class PaymentProcessCoordinator implements PaymentProcessCoordinatorPort {
  constructor(private readonly dataSource: DataSource) {}

  async initializePendingPayment(
    input: InitializePendingPaymentInput,
  ): ResultAsync<InitializePendingPaymentResult> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      await runner.startTransaction();

      const product = await runner.manager.findOne(ProductOrmEntity, {
        where: { id: input.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        await runner.rollbackTransaction();
        return err(new Error('Product not found'));
      }
      if (product.stock < input.quantity) {
        await runner.rollbackTransaction();
        return err(new Error('Insufficient stock'));
      }

      let customer = await runner.manager.findOne(CustomerOrmEntity, {
        where: { email: input.deliveryInfo.email },
      });
      if (!customer) {
        customer = runner.manager.create(CustomerOrmEntity, {
          fullName: input.deliveryInfo.fullName,
          email: input.deliveryInfo.email,
          phone: input.deliveryInfo.phone,
          documentType: input.deliveryInfo.documentType ?? null,
          documentNumber: input.deliveryInfo.documentNumber ?? null,
          address: input.deliveryInfo.address,
          city: input.deliveryInfo.city,
          postalCode: input.deliveryInfo.postalCode,
        });
        customer = await runner.manager.save(customer);
      } else {
        customer.fullName = input.deliveryInfo.fullName;
        customer.phone = input.deliveryInfo.phone;
        customer.documentType = input.deliveryInfo.documentType ?? null;
        customer.documentNumber = input.deliveryInfo.documentNumber ?? null;
        customer.address = input.deliveryInfo.address;
        customer.city = input.deliveryInfo.city;
        customer.postalCode = input.deliveryInfo.postalCode;
        customer = await runner.manager.save(customer);
      }

      const reference =
        input.reference ||
        `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const baseAmount = product.price * input.quantity;
      const totalAmount = baseAmount + input.baseFee + input.deliveryFee;
      const transaction = runner.manager.create(TransactionOrmEntity, {
        reference,
        productId: product.id,
        customerId: customer.id,
        quantity: input.quantity,
        amount: baseAmount,
        baseFee: input.baseFee,
        deliveryFee: input.deliveryFee,
        totalAmount,
        status: TransactionStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      });

      const saved = await runner.manager.save(transaction);
      await runner.commitTransaction();

      return ok({
        transaction: this.toDomain(saved),
        customerEmail: customer.email,
      });
    } catch (e: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      const error = e as { code?: string; message?: string };
      if (error.code === '23505' && input.reference) {
        const existing = await this.dataSource
          .getRepository(TransactionOrmEntity)
          .findOne({ where: { reference: input.reference } });
        if (existing) {
          return ok({
            transaction: this.toDomain(existing),
            customerEmail: input.deliveryInfo.email,
          });
        }
      }
      return err(
        new Error(
          `Failed to initialize pending payment: ${e instanceof Error ? e.message : 'Unknown'}`,
        ),
      );
    } finally {
      await runner.release();
    }
  }

  async finalizePayment(
    input: FinalizePaymentInput,
  ): ResultAsync<FinalizePaymentResult> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      await runner.startTransaction();

      const transaction = await runner.manager.findOne(TransactionOrmEntity, {
        where: { id: input.transactionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        await runner.rollbackTransaction();
        return err(new Error('Transaction not found'));
      }

      const existingDelivery = await runner.manager.findOne(DeliveryOrmEntity, {
        where: { transactionId: transaction.id },
      });

      if (transaction.status !== TransactionStatus.PENDING) {
        await runner.commitTransaction();
        return ok({
          transaction: this.toDomain(transaction),
          deliveryId: existingDelivery?.id,
          stockUpdated: false,
        });
      }

      let stockUpdated = false;
      transaction.status = input.status;
      if (typeof input.externalTransactionId !== 'undefined') {
        transaction.externalTransactionId = input.externalTransactionId;
      }
      if (typeof input.externalReference !== 'undefined') {
        transaction.externalReference = input.externalReference;
      }
      if (typeof input.errorMessage !== 'undefined') {
        transaction.errorMessage = input.errorMessage;
      }

      if (input.status === TransactionStatus.APPROVED) {
        const product = await runner.manager.findOne(ProductOrmEntity, {
          where: { id: transaction.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product || product.stock < transaction.quantity) {
          transaction.status = TransactionStatus.ERROR;
          transaction.errorMessage = 'Insufficient stock at finalization';
        } else {
          product.stock -= transaction.quantity;
          await runner.manager.save(product);
          stockUpdated = true;
        }
      }

      let deliveryId = existingDelivery?.id;
      const shouldAssignDelivery =
        transaction.status === TransactionStatus.APPROVED ||
        transaction.status === TransactionStatus.DECLINED ||
        transaction.status === TransactionStatus.ERROR;

      if (shouldAssignDelivery && !existingDelivery) {
        const customer = await runner.manager.findOne(CustomerOrmEntity, {
          where: { id: transaction.customerId },
        });
        const deliveryStatus =
          transaction.status === TransactionStatus.APPROVED
            ? DeliveryStatus.ASSIGNED
            : DeliveryStatus.CANCELLED;

        const delivery = runner.manager.create(DeliveryOrmEntity, {
          transactionId: transaction.id,
          transactionReference: transaction.reference,
          productId: transaction.productId,
          customerId: transaction.customerId,
          addressSnapshot: customer?.address || '',
          citySnapshot: customer?.city || '',
          postalCodeSnapshot: customer?.postalCode || '',
          status: deliveryStatus,
          assignedAt: new Date(),
        });
        const savedDelivery = await runner.manager.save(delivery);
        deliveryId = savedDelivery.id;
      }

      const savedTransaction = await runner.manager.save(transaction);
      await runner.commitTransaction();

      return ok({
        transaction: this.toDomain(savedTransaction),
        deliveryId,
        stockUpdated,
      });
    } catch (e: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      return err(
        new Error(
          `Failed to finalize payment: ${e instanceof Error ? e.message : 'Unknown'}`,
        ),
      );
    } finally {
      await runner.release();
    }
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
      externalTransactionId: entity.externalTransactionId ?? undefined,
      externalReference: entity.externalReference ?? undefined,
      errorMessage: entity.errorMessage ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
