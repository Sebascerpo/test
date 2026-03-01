// Transactions Controller
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  createProcessPaymentUseCase,
  ProcessPaymentUseCase,
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '../../application/use-cases/process-payment.use-case';
import {
  createSyncTransactionStatusUseCase,
  SyncTransactionStatusUseCase,
  SyncTransactionStatusResult,
} from '../../application/use-cases/sync-transaction-status.use-case';
import { TransactionRepositoryPort } from '../../application/ports/transaction.repository.port';
import { ProductRepositoryPort } from '../../../products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/application/ports/customer.repository.port';
import {
  PaymentGatewayPort,
  PaymentConfig,
} from '../../../payment/application/ports/payment-gateway.port';
import {
  ProcessPaymentDto,
  TransactionResponseDto,
} from '../dto/transaction.dto';
import { match } from '../../../../shared/common/rop';

@Controller('api')
export class TransactionsController {
  private readonly processPaymentUseCase: ProcessPaymentUseCase;
  private readonly syncTransactionStatusUseCase: SyncTransactionStatusUseCase;

  constructor(
    @Inject(TransactionRepositoryPort)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(ProductRepositoryPort)
    productRepository: ProductRepositoryPort,
    @Inject(CustomerRepositoryPort)
    customerRepository: CustomerRepositoryPort,
    @Inject(PaymentGatewayPort)
    paymentGateway: PaymentGatewayPort,
    private readonly paymentConfig: PaymentConfig,
    private readonly dataSource: DataSource,
  ) {
    this.processPaymentUseCase = createProcessPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      paymentGateway,
      paymentConfig,
      dataSource,
    );
    this.syncTransactionStatusUseCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      dataSource,
    );
  }

  @Post('payment/process')
  async process(
    @Body() dto: ProcessPaymentDto,
  ): Promise<TransactionResponseDto> {
    const input: ProcessPaymentInput = {
      productId: dto.productId,
      quantity: dto.quantity,
      deliveryInfo: {
        fullName: dto.deliveryInfo.fullName,
        email: dto.deliveryInfo.email,
        phone: dto.deliveryInfo.phone,
        address: dto.deliveryInfo.address,
        city: dto.deliveryInfo.city,
        postalCode: dto.deliveryInfo.postalCode,
      },
      cardInfo: {
        number: dto.cardInfo.number,
        cvc: dto.cardInfo.cvv, // Ensure mapping cvv to cvc if that's what generic gateway expects
        exp_month: dto.cardInfo.expMonth,
        exp_year: dto.cardInfo.expYear,
        card_holder: dto.cardInfo.cardHolder,
      },
    };

    const result = await this.processPaymentUseCase(input);

    return match<ProcessPaymentResult, Error, TransactionResponseDto>(
      (data) => ({
        success: true,
        transaction: {
          id: data.transaction.id,
          reference: data.transaction.reference,
          status: data.transaction.status,
          amount: data.transaction.amount,
          baseFee: data.transaction.baseFee,
          deliveryFee: data.transaction.deliveryFee,
          totalAmount: data.transaction.totalAmount,
          productId: data.transaction.productId,
          createdAt: data.transaction.createdAt,
          externalTransactionId: data.transaction.externalTransactionId ?? '',
          errorMessage: data.transaction.errorMessage ?? '',
        },
        message: data.message,
      }),
      (error) => {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      },
    )(result);
  }

  @Get('transactions')
  async findAll() {
    const transactions = await this.transactionRepository.findAll();
    return { success: true, data: transactions };
  }

  @Get('transactions/:id')
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data: transaction };
  }

  @Get('transactions/reference/:reference')
  async findByReference(@Param('reference') reference: string) {
    const transaction =
      await this.transactionRepository.findByReference(reference);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data: transaction };
  }

  @Get('transactions/reference/:reference/sync')
  async syncByReference(@Param('reference') reference: string) {
    const result = await this.syncTransactionStatusUseCase(reference);

    return match<SyncTransactionStatusResult, Error, any>(
      (data) => ({
        success: true,
        transaction: data.transaction,
        updated: data.updated,
      }),
      (error) => {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      },
    )(result);
  }
}
