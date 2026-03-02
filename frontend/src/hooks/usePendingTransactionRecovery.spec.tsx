import { StrictMode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { paymentInitialState, paymentReducer } from "@/store/payment-store";
import { usePendingTransactionRecovery } from "@/hooks/usePendingTransactionRecovery";

function RecoveryProbe() {
  usePendingTransactionRecovery();
  return null;
}

describe("usePendingTransactionRecovery", () => {
  it("keeps summary and avoids duplicate immediate sync calls in StrictMode", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    const store = configureStore({
      reducer: { payment: paymentReducer } as any,
      preloadedState: {
        payment: {
          ...paymentInitialState,
          currentStep: "summary" as const,
          pendingTransactionReference: "TX-RECOVERY-1",
        },
      } as any,
    }) as any;

    render(
      <StrictMode>
        <Provider store={store}>
          <RecoveryProbe />
        </Provider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect((store.getState() as any).payment.currentStep).toBe("summary");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    fetchSpy.mockRestore();
  });
});
