import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { TransactionResultPage } from "@/features/transaction/components/TransactionResultPage";

function renderResultPage(status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR", onDismiss: (options: { showToast: boolean; refreshProducts: boolean }) => void) {
  const store = configureStore({
    reducer: { payment: paymentReducer } as any,
    preloadedState: {
      payment: {
        ...paymentInitialState,
        selectedProduct: {
          id: "product-1",
          name: "Monitor",
          description: "QHD",
          price: 1200000,
          imageUrl: null,
          stock: 5,
        },
        quantity: 1,
        cardPreview: {
          brand: "VISA" as const,
          last4: "4242",
          holderName: "JUAN PEREZ",
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
        transactionResult: {
          id: "tx-1",
          transactionNumber: "TX-TEST-1",
          status,
          amount: 1200000,
        },
      },
    } as any,
  }) as any;

  return render(
    <Provider store={store}>
      <TransactionResultPage onDismiss={onDismiss} />
    </Provider>,
  );
}

describe("TransactionResultPage auto redirect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto redirects on terminal status with countdown", async () => {
    const onDismiss = vi.fn();
    renderResultPage("APPROVED", onDismiss);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5200);
    });

    expect(onDismiss).toHaveBeenCalledWith({
      showToast: true,
      refreshProducts: true,
    });
  });

  it("does not auto redirect while status is pending", () => {
    const onDismiss = vi.fn();
    renderResultPage("PENDING", onDismiss);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("allows cancelling automatic redirect", () => {
    const onDismiss = vi.fn();

    renderResultPage("DECLINED", onDismiss);

    fireEvent.click(screen.getByRole("button", { name: /Quedarme aquí/i }));
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
