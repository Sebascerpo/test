import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { ProductCatalog } from "@/features/catalog/components/ProductCatalog";
import { PaymentModal } from "@/features/checkout/components/PaymentModal";
import { TransactionResultPage } from "@/features/transaction/components/TransactionResultPage";

function makeStore(preloaded?: unknown) {
  return configureStore({
    reducer: { payment: paymentReducer } as any,
    preloadedState: {
      payment: {
        ...paymentInitialState,
        ...(preloaded as object),
      },
    } as any,
  }) as any;
}

describe("Responsive contracts", () => {
  it("product catalog grid keeps responsive breakpoints", async () => {
    const store = makeStore();

    const { container } = render(
      <Provider store={store}>
        <ProductCatalog />
      </Provider>,
    );

    await screen.findByText("Nuestros Productos");
    const grid = container.querySelector(
      ".grid.grid-cols-2.sm\\:grid-cols-4",
    );
    expect(grid).toBeInTheDocument();
  });

  it("payment modal sheet preserves mobile-safe vertical bounds", () => {
    const store = makeStore({
      selectedProduct: {
        id: "product-1",
        name: "Monitor",
        description: "QHD",
        price: 1200000,
        imageUrl: null,
        stock: 5,
      },
      quantity: 1,
    });

    const { container } = render(
      <Provider store={store}>
        <PaymentModal
          open
          onOpenChange={() => undefined}
          product={{
            id: "product-1",
            name: "Monitor",
            description: "QHD",
            price: 1200000,
            imageUrl: null,
            stock: 5,
          }}
          onComplete={() => undefined}
        />
      </Provider>,
    );

    const sheet = container.querySelector(".rounded-t-\\[24px\\]");
    expect(sheet).toHaveStyle({ maxHeight: "95svh" });
  });

  it("result page remains fixed full-screen overlay on mobile", () => {
    const store = makeStore({
      transactionResult: {
        id: "tx-1",
        transactionNumber: "TX-TEST",
        status: "APPROVED",
        amount: 1200000,
      },
      selectedProduct: {
        id: "product-1",
        name: "Monitor",
        description: "QHD",
        price: 1200000,
        imageUrl: null,
        stock: 5,
      },
      quantity: 1,
    });

    const { container } = render(
      <Provider store={store}>
        <TransactionResultPage
          onDismiss={() => undefined}
        />
      </Provider>,
    );

    const overlay = container.querySelector(".fixed.inset-0.z-\\[60\\]");
    expect(overlay).toBeInTheDocument();
  });
});
