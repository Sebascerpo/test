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

export type Step = "product" | "payment-info" | "summary" | "result";

export type CardBrand = "VISA" | "MASTERCARD" | "UNKNOWN";

export interface RuntimeCardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  brand: CardBrand;
}

export interface CardPreview {
  brand: CardBrand;
  last4: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
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
  cardPreview: CardPreview | null;
  cardEntryComplete: boolean;
  deliveryInfo: DeliveryInfo | null;
  pendingTransactionReference: string | null;
  pendingStartedAt: number | null;
  transactionResult: TransactionResult | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncReference: string | null;
  sensitiveSession: {
    card: RuntimeCardData | null;
  };
  error: string | null;
}

const initialState: PaymentState = {
  currentStep: "product",
  selectedProduct: null,
  quantity: 1,
  cardPreview: null,
  cardEntryComplete: false,
  deliveryInfo: null,
  pendingTransactionReference: null,
  pendingStartedAt: null,
  transactionResult: null,
  isLoading: false,
  isSyncing: false,
  lastSyncAt: null,
  syncReference: null,
  sensitiveSession: {
    card: null,
  },
  error: null,
};

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

const isTerminalStatus = (status: TransactionResult["status"]): boolean =>
  status !== "PENDING";

export const processPayment = createAsyncThunk(
  "payment/process",
  async (
    payload: { card?: RuntimeCardData } | undefined,
    { getState, dispatch },
  ): Promise<AsyncResult<TransactionResult>> => {
    const state = (getState() as { payment: PaymentState }).payment;

    if (!state.selectedProduct || !state.deliveryInfo) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Faltan datos para procesar el pago.",
          retryable: false,
        },
      };
    }

    const runtimeCard = payload?.card || state.sensitiveSession.card;
    if (!runtimeCard) {
      dispatch(setCardEntryComplete(false));
      dispatch(setCurrentStep("payment-info"));
      return {
        success: false,
        error: {
          code: "CARD_DATA_REQUIRED",
          message:
            "Por seguridad, vuelve a ingresar el número de tarjeta y el CVC para continuar con el pago.",
          retryable: false,
        },
      };
    }

    dispatch(setRuntimeCard(runtimeCard));

    const reference =
      state.pendingTransactionReference || createClientPaymentReference();
    dispatch(setPendingTransactionReference(reference));

    const result = await processPaymentApi({
      reference,
      productId: state.selectedProduct.id,
      quantity: state.quantity,
      card: runtimeCard,
      delivery: state.deliveryInfo,
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    dispatch(setPendingTransactionReference(result.value.transactionNumber));
    return { success: true, data: result.value };
  },
);

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
    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  },
  {
    condition: (reference, { getState }) => {
      const state = (getState() as { payment: PaymentState }).payment;
      const pendingReference =
        reference ||
        state.pendingTransactionReference ||
        state.transactionResult?.transactionNumber;

      if (!pendingReference) return false;
      if (state.isSyncing && state.syncReference === pendingReference)
        return false;

      const recentSyncMs = 900;
      const elapsed = state.lastSyncAt ? Date.now() - state.lastSyncAt : null;
      if (
        elapsed !== null &&
        elapsed < recentSyncMs &&
        state.syncReference === pendingReference
      ) {
        return false;
      }

      return true;
    },
  },
);

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
      state.error = null;
    },
    setCardPreview: (state, action: PayloadAction<CardPreview | null>) => {
      state.cardPreview = action.payload;
    },
    setCardEntryComplete: (state, action: PayloadAction<boolean>) => {
      state.cardEntryComplete = action.payload;
    },
    setRuntimeCard: (state, action: PayloadAction<RuntimeCardData | null>) => {
      state.sensitiveSession.card = action.payload;
    },
    setDeliveryInfo: (state, action: PayloadAction<DeliveryInfo>) => {
      state.deliveryInfo = action.payload;
    },
    setPendingTransactionReference: (state, action: PayloadAction<string>) => {
      if (state.pendingTransactionReference !== action.payload) {
        state.pendingStartedAt = Date.now();
      }
      state.pendingTransactionReference = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<Step>) => {
      state.currentStep = action.payload;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(processPayment.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(processPayment.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.success) {
        state.transactionResult = action.payload.data;
        state.currentStep = "result";
        state.sensitiveSession.card = null;
        state.cardEntryComplete = false;
        if (isTerminalStatus(action.payload.data.status)) {
          state.pendingTransactionReference = null;
          state.pendingStartedAt = null;
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

    builder.addCase(syncTransactionStatus.pending, (state, action) => {
      state.isSyncing = true;
      state.error = null;
      state.syncReference =
        action.meta.arg ||
        state.pendingTransactionReference ||
        state.transactionResult?.transactionNumber ||
        null;
    });

    builder.addCase(syncTransactionStatus.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.lastSyncAt = Date.now();

      if (action.payload.success) {
        state.transactionResult = action.payload.data;
        state.currentStep = "result";
        if (isTerminalStatus(action.payload.data.status)) {
          state.pendingTransactionReference = null;
          state.pendingStartedAt = null;
        }
        return;
      }

      state.error = action.payload.error.message;
      if (action.payload.error.code === "TRANSACTION_NOT_FOUND") {
        const pendingAgeMs = state.pendingStartedAt
          ? Date.now() - state.pendingStartedAt
          : Number.MAX_SAFE_INTEGER;
        const canStillRetry = pendingAgeMs < 120_000;
        if (canStillRetry) {
          state.currentStep = "result";
          state.error =
            "Estamos confirmando tu pago. Puede tardar unos segundos más.";
          return;
        }
      }

      if (!action.payload.error.retryable) {
        state.pendingTransactionReference = null;
        state.pendingStartedAt = null;
        state.currentStep =
          state.selectedProduct && state.cardPreview && state.deliveryInfo
            ? "summary"
            : "product";
      }
    });

    builder.addCase(syncTransactionStatus.rejected, (state) => {
      state.isSyncing = false;
      state.lastSyncAt = Date.now();
      state.error = "No pudimos actualizar el estado más reciente del pago.";
    });
  },
});

export const paymentReducer = paymentSlice.reducer;
export const paymentInitialState = initialState;

export const {
  setSelectedProduct,
  setCardPreview,
  setCardEntryComplete,
  setRuntimeCard,
  setDeliveryInfo,
  setPendingTransactionReference,
  setCurrentStep,
  reset,
} = paymentSlice.actions;

export const sanitizePaymentStateForPersistence = (
  state: PaymentState,
): PaymentState => ({
  ...state,
  sensitiveSession: { card: null },
  cardEntryComplete: false,
  isSyncing: false,
  syncReference: null,
  isLoading: false,
  error: null,
});

const persistConfig = {
  key: "payment-store-v5",
  storage,
  whitelist: [
    "selectedProduct",
    "quantity",
    "cardPreview",
    "deliveryInfo",
    "currentStep",
    "pendingTransactionReference",
    "pendingStartedAt",
    "transactionResult",
  ],
};

const persistedReducer = persistReducer(persistConfig, paymentReducer);

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

export const detectCardBrand = (number: string): CardBrand => {
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

  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cleaned.charAt(i), 10);
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
  const m = Number.parseInt(month, 10);
  const y = Number.parseInt(year, 10);
  if (m < 1 || m > 12) return false;

  const now = new Date();
  const currentY = now.getFullYear() % 100;
  const currentM = now.getMonth() + 1;

  return y > currentY || (y === currentY && m >= currentM);
};

export const validateCVC = (cvc: string): boolean => /^\d{3,4}$/.test(cvc);
