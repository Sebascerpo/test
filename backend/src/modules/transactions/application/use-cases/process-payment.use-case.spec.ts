import { createProcessPaymentUseCase } from './process-payment.use-case';
import { TransactionStatus } from '../../domain/transaction.entity';

describe('process-payment.use-case', () => {
  const baseInput = {
    reference: 'TX-TEST-REF-1',
    productId: 'product-1',
    quantity: 1,
    deliveryInfo: {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '3000000000',
      address: 'Main St 123',
      city: 'Bogota',
      postalCode: '110111',
    },
    cardInfo: {
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '30',
      card_holder: 'JANE DOE',
    },
  };

  it('returns existing transaction for duplicated reference', async () => {
    const existing = {
      id: 'tx-1',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-1',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(existing),
    };
    const paymentGateway: any = {};
    const paymentConfig: any = {};
    const paymentCoordinator: any = {};

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.transaction.reference).toBe(baseInput.reference);
    }
    expect(transactionRepository.findByReference).toHaveBeenCalledWith(
      baseInput.reference,
    );
  });

  it('processes approved transaction and returns delivery id', async () => {
    const pendingTransaction = {
      id: 'tx-2',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-2',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: {
          transaction: { ...pendingTransaction, status: TransactionStatus.APPROVED },
          deliveryId: 'delivery-1',
          stockUpdated: true,
        },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-1', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: true,
        value: 'acc-1',
      }),
      createPaymentSource: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ps-1' },
      }),
      createTransaction: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ext-1', status: 'APPROVED', reference: baseInput.reference },
      }),
      generateSignature: jest.fn().mockReturnValue('sig-1'),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.transaction.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.deliveryId).toBe('delivery-1');
    }
    expect(paymentCoordinator.initializePendingPayment).toHaveBeenCalled();
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalled();
  });

  it('finalizes as ERROR when tokenization fails', async () => {
    const pendingTransaction = {
      id: 'tx-3',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-3',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: {
          transaction: { ...pendingTransaction, status: TransactionStatus.ERROR },
          stockUpdated: false,
        },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('token failed'),
      }),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.transaction.status).toBe(TransactionStatus.ERROR);
    }
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('returns error when pending initialization fails', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('init failed'),
      }),
    };
    const paymentGateway: any = {};
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(false);
  });

  it('finalizes as ERROR when acceptance token fetch fails', async () => {
    const pendingTransaction = {
      id: 'tx-4',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-4',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: { ...pendingTransaction, status: TransactionStatus.ERROR } },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-2', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('acceptance failed'),
      }),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('finalizes as ERROR when payment source creation fails', async () => {
    const pendingTransaction = {
      id: 'tx-5',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-5',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: { ...pendingTransaction, status: TransactionStatus.ERROR } },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-3', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: true,
        value: 'acc-3',
      }),
      createPaymentSource: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('source failed'),
      }),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('maps external DECLINED to internal DECLINED', async () => {
    const pendingTransaction = {
      id: 'tx-6',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-6',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: { ...pendingTransaction, status: TransactionStatus.DECLINED } },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-4', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: true,
        value: 'acc-4',
      }),
      createPaymentSource: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ps-4' },
      }),
      createTransaction: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ext-4', status: 'DECLINED', reference: baseInput.reference },
      }),
      generateSignature: jest.fn().mockReturnValue('sig-4'),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.DECLINED }),
    );
  });

  it('maps unknown external status to ERROR', async () => {
    const pendingTransaction = {
      id: 'tx-7',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-7',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: { ...pendingTransaction, status: TransactionStatus.ERROR } },
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-5', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: true,
        value: 'acc-5',
      }),
      createPaymentSource: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ps-5' },
      }),
      createTransaction: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ext-5', status: 'VOIDED', reference: baseInput.reference },
      }),
      generateSignature: jest.fn().mockReturnValue('sig-5'),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(true);
    expect(paymentCoordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('returns error when finalization fails', async () => {
    const pendingTransaction = {
      id: 'tx-8',
      reference: baseInput.reference,
      productId: baseInput.productId,
      customerId: 'c-8',
      quantity: 1,
      amount: 1000,
      baseFee: 100,
      deliveryFee: 200,
      totalAmount: 1300,
      status: TransactionStatus.PENDING,
      paymentMethod: 'CREDIT_CARD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
    };
    const paymentCoordinator: any = {
      initializePendingPayment: jest.fn().mockResolvedValue({
        success: true,
        value: { transaction: pendingTransaction, customerEmail: 'jane@example.com' },
      }),
      finalizePayment: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('finalize failed'),
      }),
    };
    const paymentGateway: any = {
      tokenizeCard: jest.fn().mockResolvedValue({
        success: true,
        value: { token: 'tok-6', last_four: '4242' },
      }),
      getAcceptanceToken: jest.fn().mockResolvedValue({
        success: true,
        value: 'acc-6',
      }),
      createPaymentSource: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ps-6' },
      }),
      createTransaction: jest.fn().mockResolvedValue({
        success: true,
        value: { id: 'ext-6', status: 'PENDING', reference: baseInput.reference },
      }),
      generateSignature: jest.fn().mockReturnValue('sig-6'),
    };
    const paymentConfig: any = { currency: 'COP', baseFee: 100, deliveryFee: 200 };

    const useCase = createProcessPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfig,
      paymentCoordinator,
    );
    const result = await useCase(baseInput);

    expect(result.success).toBe(false);
  });
});
