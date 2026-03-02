import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { processPaymentApi, syncTransactionStatusApi } from "@/lib/payment-api";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("payment-api ROP flows", () => {
  it("processPaymentApi maps non-2xx responses to HTTP_ERROR", async () => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "gateway down" }),
    } as Response);

    const result = await processPaymentApi({
      reference: "TX-ERR-1",
      productId: "product-1",
      quantity: 1,
      card: {
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      },
      delivery: {
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HTTP_ERROR");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("processPaymentApi maps invalid success shape to INVALID_RESPONSE", async () => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await processPaymentApi({
      reference: "TX-INV-1",
      productId: "product-1",
      quantity: 1,
      card: {
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      },
      delivery: {
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RESPONSE");
    }
  });

  it("processPaymentApi maps network exceptions to NETWORK_DROPPED", async () => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const result = await processPaymentApi({
      reference: "TX-NET-1",
      productId: "product-1",
      quantity: 1,
      card: {
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      },
      delivery: {
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NETWORK_DROPPED");
    }
  });

  it("returns OFFLINE failure without throwing", async () => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    const result = await processPaymentApi({
      reference: "TX-OFF-1",
      productId: "product-1",
      quantity: 1,
      card: {
        number: "4242424242424242",
        holderName: "JUAN PEREZ",
        expiryMonth: "12",
        expiryYear: "30",
        cvc: "123",
        brand: "VISA",
      },
      delivery: {
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
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("OFFLINE");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("maps retryable sync not-found-yet shape to TRANSACTION_NOT_FOUND", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        transaction: null,
        retryable: true,
        reason: "NOT_FOUND_YET",
      }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-123");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TRANSACTION_NOT_FOUND");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("maps successful sync response to transaction result", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        transaction: {
          id: "tx-1",
          reference: "TX-123",
          status: "APPROVED",
          totalAmount: 120000,
          externalTransactionId: "ext-1",
        },
      }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.transactionNumber).toBe("TX-123");
      expect(result.value.status).toBe("APPROVED");
    }
  });

  it("maps sync non-2xx not-found response to TRANSACTION_NOT_FOUND", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "transaction not found" }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-404");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TRANSACTION_NOT_FOUND");
    }
  });

  it("maps sync non-2xx unknown errors to HTTP_ERROR", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "bad request" }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-400");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HTTP_ERROR");
      expect(result.error.retryable).toBe(false);
    }
  });

  it("maps sync malformed success shape to INVALID_RESPONSE", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-BAD");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RESPONSE");
    }
  });

  it("maps sync null transaction without retry hint to INVALID_RESPONSE", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        transaction: null,
        retryable: false,
      }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-NULL");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RESPONSE");
    }
  });

  it("maps sync null transaction with NOT_FOUND_YET reason to retryable not-found", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        transaction: null,
        retryable: false,
        reason: "NOT_FOUND_YET",
      }),
    } as Response);

    const result = await syncTransactionStatusApi("TX-REASON");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TRANSACTION_NOT_FOUND");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("maps sync fetch exceptions to NETWORK_DROPPED", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const result = await syncTransactionStatusApi("TX-NET");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NETWORK_DROPPED");
    }
  });
});
