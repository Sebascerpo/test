import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { ProductCatalog } from "@/features/catalog/components/ProductCatalog";

describe("ProductCatalog image performance hints", () => {
  it("renders product image with lazy loading and async decoding", async () => {
    const store = configureStore({
      reducer: {
        payment: paymentReducer,
      },
      preloadedState: {
        payment: paymentInitialState,
      },
    });

    render(
      <Provider store={store}>
        <ProductCatalog />
      </Provider>,
    );

    const image = await screen.findByAltText('Monitor 27"');
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image).toHaveAttribute("sizes");
  });
});
