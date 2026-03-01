import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
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

// Types
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
  transactionResult: TransactionResult | null;
  isLoading: boolean;
}

const initialState: PaymentState = {
  currentStep: "product",
  selectedProduct: null,
  quantity: 1,
  creditCard: null,
  deliveryInfo: null,
  transactionResult: null,
  isLoading: false,
};

// Payment Slice - Redux Toolkit (Flux Architecture)
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
    setCurrentStep: (state, action: PayloadAction<Step>) => {
      state.currentStep = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  setSelectedProduct,
  setCreditCard,
  setDeliveryInfo,
  setTransactionResult,
  setCurrentStep,
  setLoading,
  reset,
} = paymentSlice.actions;

// Persist config - use localStorage directly for SSR compatibility
const persistConfig = {
  key: "payment-store",
  storage: {
    getItem: (key: string) => {
      if (typeof window === "undefined") {
        return Promise.resolve(null);
      }
      const item = localStorage.getItem(key);
      return Promise.resolve(item);
    },
    setItem: (key: string, value: string) => {
      if (typeof window === "undefined") {
        return Promise.resolve();
      }
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      if (typeof window === "undefined") {
        return Promise.resolve();
      }
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  },
  whitelist: [
    "selectedProduct",
    "quantity",
    "creditCard",
    "deliveryInfo",
    "currentStep",
    "transactionResult",
  ],
};

const persistedReducer = persistReducer(persistConfig, paymentSlice.reducer);

// Store - Flux Architecture compliant
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

// Credit card validation utilities
export const detectCardBrand = (
  number: string,
): "VISA" | "MASTERCARD" | "UNKNOWN" => {
  const cleaned = number.replace(/\s/g, "");

  // VISA: starts with 4
  if (/^4/.test(cleaned)) {
    return "VISA";
  }

  // MasterCard: starts with 51-55 or 2221-2720
  if (/^(5[1-5]|2[2-7][0-9]{2})/.test(cleaned)) {
    return "MASTERCARD";
  }

  return "UNKNOWN";
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

export const formatExpiry = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

export const validateCardNumber = (number: string): boolean => {
  const cleaned = number.replace(/\s/g, "");

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (month: string, year: string): boolean => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (m < 1 || m > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (y < currentYear || (y === currentYear && m < currentMonth)) {
    return false;
  }

  return true;
};

export const validateCVC = (cvc: string): boolean => {
  return /^\d{3,4}$/.test(cvc);
};
