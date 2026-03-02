import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, jest } from "@jest/globals";
import {
  detectCardBrand,
  formatCardNumber,
  paymentInitialState,
  paymentReducer,
  processPayment,
  sanitizePaymentStateForPersistence,
  setCurrentStep,
  setDeliveryInfo,
  setRuntimeCard,
  setSelectedProduct,
  syncTransactionStatus,
  validateCardNumber,
  validateCVC,
  validateExpiryDate,
} from "@/store/payment-store";

function createTestStore(preloadedState?: unknown) {
  return configureStore({
    reducer: { payment: paymentReducer } as any,
    preloadedState: preloadedState as any,
  }) as any;
}

describe("payment-store security and resiliency", () => {
  it("sanitizes PAN/CVC before persistence", () => {
    const sensitiveState = {
      ...paymentInitialState,
      cardPreview: {
        brand: "VISA" as const,
        last4: "4242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
      },
      sensitiveSession: {
        card: {
          number: "4242424242424242",
          holderName: "JUAN PEREZ",
          expiryMonth: "12",
          expiryYear: "30",
          cvc: "123",
          brand: "VISA" as const,
        },
      },
      cardEntryComplete: true,
    };

    const sanitized = sanitizePaymentStateForPersistence(sensitiveState);
    expect(sanitized.sensitiveSession.card).toBeNull();
    expect(sanitized.cardEntryComplete).toBe(false);

    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("4242424242424242");
    expect(serialized).not.toContain('"cvc"');
  });

  it("routes user back to payment-info when raw card data is missing", async () => {
    const store = createTestStore();

    store.dispatch(
      setSelectedProduct({
        product: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1200000,
          imageUrl: null,
          stock: 5,
        },
        quantity: 1,
      }),
    );
    store.dispatch(
      setDeliveryInfo({
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        phone: "3001234567",
        documentType: "CC",
        documentNumber: "123456",
        address: "Calle 123",
        city: "Bogotá",
        state: "Cundinamarca",
        postalCode: "110111",
        additionalInfo: "",
      }),
    );
    store.dispatch(setCurrentStep("summary"));

    const action = (await store.dispatch(processPayment(undefined))) as any;

    expect(action.type).toBe("payment/process/fulfilled");
    if (action.type === "payment/process/fulfilled") {
      expect(action.payload.success).toBe(false);
      if (!action.payload.success) {
        expect(action.payload.error.code).toBe("CARD_DATA_REQUIRED");
      }
    }

    expect((store.getState() as any).payment.currentStep).toBe("payment-info");
  });

  it("returns INVALID_RESPONSE when product or delivery data is missing", async () => {
    const store = createTestStore();
    const action = (await store.dispatch(processPayment(undefined))) as any;

    expect(action.type).toBe("payment/process/fulfilled");
    expect(action.payload.success).toBe(false);
    expect(action.payload.error.code).toBe("INVALID_RESPONSE");
  });

  it("processes payment with runtime card and clears sensitive session afterwards", async () => {
    const store = createTestStore();

    store.dispatch(
      setSelectedProduct({
        product: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1200000,
          imageUrl: null,
          stock: 5,
        },
        quantity: 1,
      }),
    );
    store.dispatch(
      setDeliveryInfo({
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        phone: "3001234567",
        documentType: "CC",
        documentNumber: "123456",
        address: "Calle 123",
        city: "Bogotá",
        state: "Cundinamarca",
        postalCode: "110111",
        additionalInfo: "",
      }),
    );

    store.dispatch(
      setRuntimeCard({
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      }),
    );

    const action = (await store.dispatch(processPayment())) as any;
    expect(action.type).toBe("payment/process/fulfilled");

    const state = (store.getState() as any).payment;
    expect(state.transactionResult?.transactionNumber).toBe("TX-TEST-1");
    expect(state.sensitiveSession.card).toBeNull();
  });

  it("handles process payment API errors as fulfilled failure", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "server error" }),
    } as Response);

    const store = createTestStore();
    store.dispatch(
      setSelectedProduct({
        product: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1200000,
          imageUrl: null,
          stock: 5,
        },
        quantity: 1,
      }),
    );
    store.dispatch(
      setDeliveryInfo({
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        phone: "3001234567",
        documentType: "CC",
        documentNumber: "123456",
        address: "Calle 123",
        city: "Bogotá",
        state: "Cundinamarca",
        postalCode: "110111",
        additionalInfo: "",
      }),
    );
    store.dispatch(
      setRuntimeCard({
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      }),
    );

    const action = (await store.dispatch(processPayment())) as any;
    expect(action.type).toBe("payment/process/fulfilled");
    expect(action.payload.success).toBe(false);
    expect((store.getState() as any).payment.error).toContain("server error");

    fetchSpy.mockRestore();
  });

  it("skips sync thunk when same reference is already syncing", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    const preloadedState = {
      payment: {
        ...paymentInitialState,
        pendingTransactionReference: "TX-DUP-1",
        isSyncing: true,
        syncReference: "TX-DUP-1",
      },
    };

    const store = createTestStore(preloadedState);
    const action = (await store.dispatch(
      syncTransactionStatus("TX-DUP-1"),
    )) as any;

    expect(action.type).toBe("payment/sync/rejected");
    expect(action.meta.condition).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("skips sync when no pending reference exists", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const store = createTestStore();

    const action = (await store.dispatch(
      syncTransactionStatus(undefined),
    )) as any;
    expect(action.type).toBe("payment/sync/rejected");
    expect(action.meta.condition).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("skips sync when same reference was synced very recently", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        pendingTransactionReference: "TX-RECENT-1",
        syncReference: "TX-RECENT-1",
        lastSyncAt: Date.now(),
      },
    });

    const action = (await store.dispatch(
      syncTransactionStatus("TX-RECENT-1"),
    )) as any;
    expect(action.type).toBe("payment/sync/rejected");
    expect(action.meta.condition).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("clears pending reference when process payment returns terminal status", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        pendingTransactionReference: "TX-PENDING-1",
        pendingStartedAt: Date.now(),
      },
    });

    store.dispatch({
      type: processPayment.fulfilled.type,
      payload: {
        success: true,
        data: {
          id: "tx-1",
          transactionNumber: "TX-PENDING-1",
          status: "APPROVED",
          amount: 1000,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.pendingTransactionReference).toBeNull();
    expect(state.currentStep).toBe("result");
  });

  it("keeps user in result when sync returns retryable not-found", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "result",
        pendingTransactionReference: "TX-PENDING-2",
        pendingStartedAt: Date.now(),
      },
    });

    store.dispatch({
      type: syncTransactionStatus.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Aún no visible",
          retryable: true,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.currentStep).toBe("result");
    expect(state.pendingTransactionReference).toBe("TX-PENDING-2");
  });

  it("keeps user in summary when sync returns retryable not-found and checkout context is complete", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "summary",
        selectedProduct: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1000,
          imageUrl: null,
          stock: 1,
        },
        cardPreview: {
          brand: "VISA",
          last4: "4242",
          holderName: "JUAN",
          expiryMonth: "12",
          expiryYear: "30",
        },
        deliveryInfo: {
          firstName: "Juan",
          lastName: "Pérez",
          email: "juan@example.com",
          phone: "3001234567",
          documentType: "CC",
          documentNumber: "123456",
          address: "Calle 123",
          city: "Bogotá",
          state: "Cundinamarca",
          postalCode: "110111",
          additionalInfo: "",
        },
        pendingTransactionReference: "TX-PENDING-SUMMARY",
        pendingStartedAt: Date.now(),
      },
    });

    store.dispatch({
      type: syncTransactionStatus.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Aún no visible",
          retryable: true,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.currentStep).toBe("summary");
    expect(state.pendingTransactionReference).toBe("TX-PENDING-SUMMARY");
    expect(state.error).toContain("Estamos confirmando tu pago");
  });

  it("clears stale pending reference when retryable not-found exceeds grace window", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "result",
        selectedProduct: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1000,
          imageUrl: null,
          stock: 1,
        },
        cardPreview: {
          brand: "VISA",
          last4: "4242",
          holderName: "JUAN",
          expiryMonth: "12",
          expiryYear: "30",
        },
        deliveryInfo: {
          firstName: "Juan",
          lastName: "Pérez",
          email: "juan@example.com",
          phone: "3001234567",
          documentType: "CC",
          documentNumber: "123456",
          address: "Calle 123",
          city: "Bogotá",
          state: "Cundinamarca",
          postalCode: "110111",
          additionalInfo: "",
        },
        pendingTransactionReference: "TX-PENDING-EXPIRED",
        pendingStartedAt: Date.now() - 121_000,
      },
    });

    store.dispatch({
      type: syncTransactionStatus.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Aún no visible",
          retryable: true,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.pendingTransactionReference).toBeNull();
    expect(state.pendingStartedAt).toBeNull();
    expect(state.currentStep).toBe("summary");
    expect(state.error).toContain("No encontramos una transacción pendiente");
  });

  it("clears pending marker when payment fails immediately due offline", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "summary",
        pendingTransactionReference: "TX-OFFLINE-1",
        pendingStartedAt: Date.now(),
      },
    });

    store.dispatch({
      type: processPayment.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "OFFLINE",
          message: "Sin conexión",
          retryable: true,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.pendingTransactionReference).toBeNull();
    expect(state.pendingStartedAt).toBeNull();
    expect(state.currentStep).toBe("summary");
  });

  it("moves user back when sync error is non-retryable", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "result",
        selectedProduct: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1000,
          imageUrl: null,
          stock: 1,
        },
        cardPreview: {
          brand: "VISA",
          last4: "4242",
          holderName: "JUAN",
          expiryMonth: "12",
          expiryYear: "30",
        },
        deliveryInfo: {
          firstName: "Juan",
          lastName: "Pérez",
          email: "juan@example.com",
          phone: "3001234567",
          documentType: "CC",
          documentNumber: "123456",
          address: "Calle 123",
          city: "Bogotá",
          state: "Cundinamarca",
          postalCode: "110111",
          additionalInfo: "",
        },
      },
    });

    store.dispatch({
      type: syncTransactionStatus.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: "fallo",
          retryable: false,
        },
      },
    });

    const state = (store.getState() as any).payment;
    expect(state.currentStep).toBe("summary");
    expect(state.pendingTransactionReference).toBeNull();
  });

  it("moves user to product when summary context is incomplete after non-retryable sync error", () => {
    const store = createTestStore({
      payment: {
        ...paymentInitialState,
        currentStep: "result",
      },
    });

    store.dispatch({
      type: syncTransactionStatus.fulfilled.type,
      payload: {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: "fallo",
          retryable: false,
        },
      },
    });

    expect((store.getState() as any).payment.currentStep).toBe("product");
  });

  it("sets generic error on sync rejected", () => {
    const store = createTestStore();

    store.dispatch({ type: syncTransactionStatus.rejected.type });

    expect((store.getState() as any).payment.error).toContain("No pudimos");
  });

  it("exercises card utility branches", () => {
    expect(detectCardBrand("4242 4242 4242 4242")).toBe("VISA");
    expect(detectCardBrand("5555 5555 5555 4444")).toBe("MASTERCARD");
    expect(detectCardBrand("0000 0000 0000 0000")).toBe("UNKNOWN");

    expect(formatCardNumber("42424242")).toBe("4242 4242");
    expect(validateCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(validateCardNumber("1234")).toBe(false);
    expect(validateCVC("123")).toBe(true);
    expect(validateCVC("12")).toBe(false);

    const nextYear = (new Date().getFullYear() % 100) + 1;
    expect(validateExpiryDate("12", String(nextYear))).toBe(true);
    expect(validateExpiryDate("00", String(nextYear))).toBe(false);
  });
});
