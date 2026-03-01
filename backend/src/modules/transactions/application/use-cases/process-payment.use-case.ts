// Use Case: Process Payment (Main Flow - ROP)
import { ResultAsync, ok, err, flatMapAsync, mapAsync } from '../../../../shared/common/rop';
import { Transaction, TransactionStatus, TransactionCreateInput } from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { ProductRepositoryPort } from '../../../products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/application/ports/customer.repository.port';
import { WompiGatewayPort, CardTokenizationInput } from '../../../wompi/application/ports/wompi.gateway.port';
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

export type ProcessPaymentUseCase = (input: ProcessPaymentInput) => ResultAsync<ProcessPaymentResult>;

// Helper to calculate fees
const calculateFees = (amount: number, quantity: number) => {
  const baseAmount = amount * quantity;
  const baseFee = 2500; // COP $2,500 base fee
  const deliveryFee = 5000; // COP $5,000 delivery fee
  const totalAmount = baseAmount + baseFee + deliveryFee;
  return { baseAmount, baseFee, deliveryFee, totalAmount };
};

export const createProcessPaymentUseCase = (
  transactionRepository: TransactionRepositoryPort,
  productRepository: ProductRepositoryPort,
  customerRepository: CustomerRepositoryPort,
  wompiGateway: WompiGatewayPort
): ProcessPaymentUseCase => {
  return async (input: ProcessPaymentInput) => {
    // Step 1: Validate product availability (ROP)
    const productResult = await (async () => {
      try {
        const product = await productRepository.findById(input.productId);
        if (!product) {
          return err(new Error('Product not found'));
        }
        if (product.stock < input.quantity) {
          return err(new Error('Insufficient stock'));
        }
        return ok(product);
      } catch (error) {
        return err(new Error(`Failed to validate product: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    })();

    if (!productResult.success) return productResult;

    const product = productResult.value;
    const fees = calculateFees(product.price, input.quantity);

    // Step 2: Create or get customer (ROP)
    const customerResult = await (async () => {
      try {
        let customer = await customerRepository.findByEmail(input.deliveryInfo.email);
        if (!customer) {
          customer = await customerRepository.create(input.deliveryInfo);
        }
        return ok(customer);
      } catch (error) {
        return err(new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    })();

    if (!customerResult.success) return customerResult;

    const customer = customerResult.value;

    // Step 3: Create pending transaction (ROP)
    const transactionResult = await (async () => {
      try {
        const transaction = await transactionRepository.create({
          productId: input.productId,
          customerId: customer.id,
          amount: fees.baseAmount,
          baseFee: fees.baseFee,
          deliveryFee: fees.deliveryFee,
          quantity: input.quantity,
        });
        return ok(transaction);
      } catch (error) {
        return err(new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    })();

    if (!transactionResult.success) return transactionResult;

    const transaction = transactionResult.value;

    // Step 4: Tokenize card with Wompi (ROP)
    const tokenResult = await wompiGateway.tokenizeCard(input.cardInfo);
    if (!tokenResult.success) {
      await transactionRepository.updateStatus(transaction.id, TransactionStatus.ERROR, {
        errorMessage: tokenResult.error
      });
      return err(new Error(`Card tokenization failed: ${tokenResult.error}`));
    }

    // Step 5: Create payment source (ROP)
    const paymentSourceResult = await wompiGateway.createPaymentSource({
      tokenId: tokenResult.tokenId!,
      customerEmail: customer.email,
      type: 'CARD'
    });

    if (!paymentSourceResult.success) {
      await transactionRepository.updateStatus(transaction.id, TransactionStatus.ERROR, {
        errorMessage: paymentSourceResult.error
      });
      return err(new Error(`Payment source creation failed: ${paymentSourceResult.error}`));
    }

    // Step 6: Create Wompi transaction (ROP)
    const wompiTransactionResult = await wompiGateway.createTransaction({
      amountInCents: fees.totalAmount,
      currency: 'COP',
      customerEmail: customer.email,
      paymentSourceId: parseInt(paymentSourceResult.paymentSourceId!),
      reference: transaction.reference,
      paymentDescription: `Payment for ${product.name} x${input.quantity}`
    });

    // Step 7: Update transaction status based on Wompi result (ROP)
    if (!wompiTransactionResult.success) {
      await transactionRepository.updateStatus(transaction.id, TransactionStatus.ERROR, {
        errorMessage: wompiTransactionResult.error
      });
      return err(new Error(`Payment failed: ${wompiTransactionResult.error}`));
    }

    const finalStatus = wompiTransactionResult.status === 'APPROVED' 
      ? TransactionStatus.APPROVED 
      : wompiTransactionResult.status === 'DECLINED'
        ? TransactionStatus.DECLINED
        : TransactionStatus.ERROR;

    const updatedTransaction = await transactionRepository.updateStatus(
      transaction.id,
      finalStatus,
      {
        wompiTransactionId: wompiTransactionResult.transactionId,
        wompiReference: wompiTransactionResult.reference
      }
    );

    // Step 8: Update stock if approved (ROP)
    if (finalStatus === TransactionStatus.APPROVED) {
      await productRepository.updateStock(input.productId, -input.quantity);
    }

    return ok({
      transaction: updatedTransaction || transaction,
      message: finalStatus === TransactionStatus.APPROVED 
        ? 'Payment successful!' 
        : finalStatus === TransactionStatus.DECLINED
          ? 'Payment declined by payment provider'
          : 'Payment processing error'
    });
  };
};
