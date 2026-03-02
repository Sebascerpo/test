import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "@jest/globals";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { PaymentModal } from "@/features/checkout/components/PaymentModal";

describe("PaymentModal card security handling", () => {
  it("stores only card preview metadata in redux draft while typing", async () => {
    const user = userEvent.setup();

    const store = configureStore({
      reducer: {
        payment: paymentReducer,
      },
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
        },
      },
    });

    render(
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

    await user.type(
      screen.getByPlaceholderText("0000 0000 0000 0000"),
      "4242424242424242",
    );
    await user.type(
      screen.getByPlaceholderText("NOMBRE APELLIDO"),
      "JUAN PEREZ",
    );
    await user.type(screen.getByPlaceholderText("MM/AA"), "1230");
    await user.type(screen.getByPlaceholderText("•••"), "123");

    const state = store.getState().payment;

    expect(state.cardPreview?.last4).toBe("4242");
    expect(state.cardPreview?.brand).toBe("VISA");
    expect(JSON.stringify(state.cardPreview)).not.toContain("4242424242424242");
  });

  it("shows a reusable validation toast when trying to open envio without valid card data", async () => {
    const user = userEvent.setup();

    const store = configureStore({
      reducer: {
        payment: paymentReducer,
      },
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
        },
      },
    });

    render(
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

    await user.click(screen.getByRole("button", { name: /envío/i }));

    expect(
      screen.getByText("Primero debes completar los datos de la tarjeta"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Datos personales")).not.toBeInTheDocument();
  });
});
