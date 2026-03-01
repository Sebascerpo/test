import {
  configureStore,
  createSlice,
  PayloadAction,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import type { ApiFailure } from "@/lib/payment-api";
import { processPaymentApi, syncTransactionStatusApi } from "@/lib/payment-api";

// ── Types ───────────────────────────────────────────────────────────────────

export type Step = "product" | "payment-info" | "summary" | "result";

export interface CreditCard {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  brand: "VISA" | "MASTERCARD" | "UNKNOWN";
}

export interface DeliveryInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  additionalInfo: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  category?: string;
}

export interface TransactionResult {
  id: string;
  transactionNumber: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  amount: number;
  externalTransactionId?: string;
  errorMessage?: string;
}

interface PaymentState {
  currentStep: Step;
  selectedProduct: Product | null;
  quantity: number;
  creditCard: CreditCard | null;
  deliveryInfo: DeliveryInfo | null;
  pendingTransactionReference: string | null;
  transactionResult: TransactionResult | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  currentStep: "product",
  selectedProduct: null,
  quantity: 1,
  creditCard: null,
  deliveryInfo: null,
  pendingTransactionReference: null,
  transactionResult: null,
  isLoading: false,
  error: null,
};

/**
 * ROP Result Type for API calls
 */
export type AsyncResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiFailure };

const createClientPaymentReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSource =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2, 10);
  const random = randomSource.slice(0, 8).toUpperCase();
  return `TX-${timestamp}-${random}`;
};

// ── Async Thunks (ROP Principles) ───────────────────────────────────────────

/**
 * Step 2: Disaster Recovery - Process Payment
 * Initiates the payment, immediate persistence of PENDING state.
 */
export const processPayment = createAsyncThunk(
  "payment/process",
  async (_, { getState, dispatch }): Promise<AsyncResult<TransactionResult>> => {
    const state = (getState() as { payment: PaymentState }).payment;
    if (!state.selectedProduct || !state.creditCard || !state.deliveryInfo) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Faltan datos para procesar el pago.",
          retryable: false,
        },
      };
    }

    const reference =
      state.pendingTransactionReference || createClientPaymentReference();
    dispatch(setPendingTransactionReference(reference));

    const result = await processPaymentApi({
      reference,
      productId: state.selectedProduct.id,
      quantity: state.quantity,
      card: state.creditCard,
      delivery: state.deliveryInfo,
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    dispatch(setPendingTransactionReference(result.value.transactionNumber));
    return { success: true, data: result.value };
  },
);

/**
 * Step 2: Disaster Recovery - Sync Status
 * Recovers a PENDING transaction after a page refresh or network loss.
 */
export const syncTransactionStatus = createAsyncThunk(
  "payment/sync",
  async (
    reference: string | undefined,
    { getState },
  ): Promise<AsyncResult<TransactionResult>> => {
    const state = (getState() as { payment: PaymentState }).payment;
    const pendingReference =
      reference ||
      state.pendingTransactionReference ||
      state.transactionResult?.transactionNumber;

    if (!pendingReference) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "No hay una transacción pendiente para sincronizar.",
          retryable: false,
        },
      };
    }

    const result = await syncTransactionStatusApi(pendingReference);
    if (!result.ok) return { success: false, error: result.error };

    return { success: true, data: result.value };
  },
);

// ── Redux Slice ─────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setSelectedProduct: (
      state,
      action: PayloadAction<{ product: Product; quantity: number }>,
    ) => {
      state.selectedProduct = action.payload.product;
      state.quantity = action.payload.quantity;
    },
    setCreditCard: (state, action: PayloadAction<CreditCard>) => {
      state.creditCard = action.payload;
    },
    setDeliveryInfo: (state, action: PayloadAction<DeliveryInfo>) => {
      state.deliveryInfo = action.payload;
    },
    setTransactionResult: (
      state,
      action: PayloadAction<TransactionResult | null>,
    ) => {
      state.transactionResult = action.payload;
    },
    setPendingTransactionReference: (state, action: PayloadAction<string>) => {
      state.pendingTransactionReference = action.payload;
    },
    clearPendingTransactionReference: (state) => {
      state.pendingTransactionReference = null;
    },
    setCurrentStep: (state, action: PayloadAction<Step>) => {
      state.currentStep = action.payload;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    // Handle processing
    builder.addCase(processPayment.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(processPayment.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.success) {
        state.transactionResult = action.payload.data;
        state.currentStep = "result";
        if (action.payload.data.status !== "PENDING") {
          state.pendingTransactionReference = null;
        }
      } else {
        state.error = action.payload.error.message;
      }
    });
    builder.addCase(processPayment.rejected, (state) => {
      state.isLoading = false;
      state.error =
        "No pudimos completar el pago en este momento. Inténtalo nuevamente.";
    });

    // Handle sync (recovery)
    builder.addCase(syncTransactionStatus.pending, (state) => {
      state.error = null;
    });
    builder.addCase(syncTransactionStatus.fulfilled, (state, action) => {
      if (action.payload.success) {
        state.transactionResult = action.payload.data;
        state.currentStep = "result";
        if (action.payload.data.status !== "PENDING") {
          state.pendingTransactionReference = null;
        }
      } else {
        state.error = action.payload.error.message;
      }
    });
    builder.addCase(syncTransactionStatus.rejected, (state) => {
      state.error = "No pudimos actualizar el estado más reciente del pago.";
    });
  },
});

export const {
  setSelectedProduct,
  setCreditCard,
  setDeliveryInfo,
  setTransactionResult,
  setPendingTransactionReference,
  clearPendingTransactionReference,
  setCurrentStep,
  reset,
} = paymentSlice.actions;

// ── Persistence & Store Configuration ───────────────────────────────────────

const persistConfig = {
  key: "payment-store-v3",
  storage,
  whitelist: [
    "selectedProduct",
    "quantity",
    "creditCard",
    "deliveryInfo",
    "currentStep",
    "pendingTransactionReference",
    "transactionResult",
  ],
};

const persistedReducer = persistReducer(persistConfig, paymentSlice.reducer);

export const store = configureStore({
  reducer: {
    payment: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ── Utilities ───────────────────────────────────────────────────────────────

export const detectCardBrand = (
  number: string,
): "VISA" | "MASTERCARD" | "UNKNOWN" => {
  const cleaned = number.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return "VISA";
  if (/^(5[1-5]|2[2-7][0-9]{2})/.test(cleaned)) return "MASTERCARD";
  return "UNKNOWN";
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

export const validateCardNumber = (number: string): boolean => {
  const cleaned = number.replace(/\s/g, "");
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  let sum = 0,
    isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const validateExpiryDate = (month: string, year: string): boolean => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const currentY = now.getFullYear() % 100;
  const currentM = now.getMonth() + 1;
  return y > currentY || (y === currentY && m >= currentM);
};

export const validateCVC = (cvc: string): boolean => /^\d{3,4}$/.test(cvc);
