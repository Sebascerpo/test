import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { TransactionNotification } from "@/features/transaction/components/TransactionNotification";

function renderNotification(status: "APPROVED" | "PENDING" | "DECLINED" | "ERROR") {
  const store = configureStore({
    reducer: { payment: paymentReducer } as any,
    preloadedState: {
      payment: {
        ...paymentInitialState,
        selectedProduct: {
          id: "p-1",
          name: "Monitor Pro",
          description: "QHD",
          price: 1200000,
          imageUrl: null,
          stock: 10,
        },
        transactionResult: {
          id: "tx-1",
          transactionNumber: "TX-1",
          status,
          amount: 1200000,
        },
      },
    } as any,
  }) as any;

  render(
    <Provider store={store}>
      <TransactionNotification onDismiss={jest.fn()} />
    </Provider>,
  );
}

describe("TransactionNotification tones", () => {
  it("uses approved tone for approved transactions", () => {
    renderNotification("APPROVED");

    const label = screen.getByText("Pago aprobado");
    const card = label.closest(".status-toast-card");
    expect(card).toHaveClass("toast--approved");
  });

  it("uses pending tone for pending transactions", () => {
    renderNotification("PENDING");

    const label = screen.getByText("En verificación");
    const card = label.closest(".status-toast-card");
    expect(card).toHaveClass("toast--pending");
  });

  it("uses declined tone for declined transactions", () => {
    renderNotification("DECLINED");

    const label = screen.getByText("Pago rechazado");
    const card = label.closest(".status-toast-card");
    expect(card).toHaveClass("toast--declined");
  });

  it("uses declined tone for error transactions", () => {
    renderNotification("ERROR");
    const label = screen.getByText("Pago rechazado");
    const card = label.closest(".status-toast-card");
    expect(card).toHaveClass("toast--declined");
  });
});
