import { createSyncTransactionStatusUseCase } from './sync-transaction-status.use-case';
import { TransactionStatus } from '../../domain/transaction.entity';

describe('sync-transaction-status.use-case', () => {
  it('returns retryable not found state when transaction is missing', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
    };
    const paymentGateway: any = {};
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-NOT-FOUND');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.transaction).toBeNull();
      expect(result.value.retryable).toBe(true);
      expect(result.value.reason).toBe('NOT_FOUND_YET');
    }
  });

  it('returns unchanged when transaction is not pending', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue({
        id: 'tx-1',
        status: TransactionStatus.APPROVED,
      }),
    };
    const paymentGateway: any = {};
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.updated).toBe(false);
    }
  });

  it('finalizes transaction when provider status changes', async () => {
    const transaction = {
      id: 'tx-2',
      status: TransactionStatus.PENDING,
      externalTransactionId: 'ext-2',
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(transaction),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: true,
        value: { status: 'APPROVED' },
      }),
    };
    const coordinator: any = {
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: {
          transaction: { ...transaction, status: TransactionStatus.APPROVED },
          deliveryId: 'delivery-1',
          stockUpdated: true,
        },
      }),
    };

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.updated).toBe(true);
      expect(result.value.transaction?.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.deliveryId).toBe('delivery-1');
    }
  });

  it('keeps pending when external status fetch fails', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue({
        id: 'tx-3',
        status: TransactionStatus.PENDING,
        externalTransactionId: 'ext-3',
      }),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('provider down'),
      }),
    };
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-3');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.updated).toBe(false);
    }
  });

  it('queries by id when identifier is uuid', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({
        id: '3f87a5f0-a360-43ad-bafc-e9a4d21813d9',
        status: TransactionStatus.APPROVED,
      }),
    };
    const paymentGateway: any = {};
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('3f87a5f0-a360-43ad-bafc-e9a4d21813d9');

    expect(result.success).toBe(true);
    expect(transactionRepository.findById).toHaveBeenCalled();
  });

  it('returns unchanged when pending has no external transaction id', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue({
        id: 'tx-4',
        status: TransactionStatus.PENDING,
        externalTransactionId: undefined,
      }),
    };
    const paymentGateway: any = {};
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-4');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.updated).toBe(false);
    }
  });

  it('returns unchanged when provider keeps transaction as pending', async () => {
    const transaction = {
      id: 'tx-5',
      status: TransactionStatus.PENDING,
      externalTransactionId: 'ext-5',
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(transaction),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: true,
        value: { status: 'PENDING' },
      }),
    };
    const coordinator: any = {
      finalizePayment: jest.fn(),
    };

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-5');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.updated).toBe(false);
    }
    expect(coordinator.finalizePayment).not.toHaveBeenCalled();
  });

  it('maps external declined and finalizes', async () => {
    const transaction = {
      id: 'tx-6',
      status: TransactionStatus.PENDING,
      externalTransactionId: 'ext-6',
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(transaction),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: true,
        value: { status: 'DECLINED' },
      }),
    };
    const coordinator: any = {
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: {
          transaction: { ...transaction, status: TransactionStatus.DECLINED },
        },
      }),
    };

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-6');

    expect(result.success).toBe(true);
    expect(coordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.DECLINED }),
    );
  });

  it('maps unknown external status to error and finalizes', async () => {
    const transaction = {
      id: 'tx-7',
      status: TransactionStatus.PENDING,
      externalTransactionId: 'ext-7',
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(transaction),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: true,
        value: { status: 'VOIDED' },
      }),
    };
    const coordinator: any = {
      finalizePayment: jest.fn().mockResolvedValue({
        success: true,
        value: {
          transaction: { ...transaction, status: TransactionStatus.ERROR },
        },
      }),
    };

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-7');

    expect(result.success).toBe(true);
    expect(coordinator.finalizePayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('returns error when finalization fails', async () => {
    const transaction = {
      id: 'tx-8',
      status: TransactionStatus.PENDING,
      externalTransactionId: 'ext-8',
    };
    const transactionRepository: any = {
      findByReference: jest.fn().mockResolvedValue(transaction),
    };
    const paymentGateway: any = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        success: true,
        value: { status: 'APPROVED' },
      }),
    };
    const coordinator: any = {
      finalizePayment: jest.fn().mockResolvedValue({
        success: false,
        error: new Error('finalize failed'),
      }),
    };

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-8');

    expect(result.success).toBe(false);
  });

  it('returns error result when unexpected exception occurs', async () => {
    const transactionRepository: any = {
      findByReference: jest.fn().mockRejectedValue('boom'),
    };
    const paymentGateway: any = {};
    const coordinator: any = {};

    const useCase = createSyncTransactionStatusUseCase(
      transactionRepository,
      paymentGateway,
      coordinator,
    );
    const result = await useCase('TX-9');

    expect(result.success).toBe(false);
  });
});
