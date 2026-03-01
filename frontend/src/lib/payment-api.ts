import type {
  DeliveryInfo,
  RuntimeCardData,
  TransactionResult,
} from "@/store/payment-store";

export interface ApiFailure {
  code:
    | "OFFLINE"
    | "NETWORK_DROPPED"
    | "HTTP_ERROR"
    | "INVALID_RESPONSE"
    | "TRANSACTION_NOT_FOUND"
    | "CARD_DATA_REQUIRED";
  message: string;
  retryable: boolean;
}

export type RopResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiFailure };

interface ProcessPaymentPayload {
  reference: string;
  productId: string;
  quantity: number;
  card: RuntimeCardData;
  delivery: DeliveryInfo;
}

interface ApiTransactionLike {
  id: string;
  reference: string;
  status: TransactionResult["status"];
  totalAmount: number;
  externalTransactionId?: string;
  errorMessage?: string;
}

const mapTransaction = (transaction: ApiTransactionLike): TransactionResult => ({
  id: transaction.id,
  transactionNumber: transaction.reference,
  status: transaction.status,
  amount: transaction.totalAmount,
  externalTransactionId: transaction.externalTransactionId,
  errorMessage: transaction.errorMessage,
});

const toNetworkFailure = (): ApiFailure => ({
  code: "NETWORK_DROPPED",
  message:
    "Parece que la conexión se interrumpió durante el pago. Guardamos tu carrito y retomaremos el proceso al reconectarte.",
  retryable: true,
});

export async function processPaymentApi(
  payload: ProcessPaymentPayload,
): Promise<RopResult<TransactionResult>> {
  if (!navigator.onLine) {
    return {
      ok: false,
      error: {
        code: "OFFLINE",
        message:
          "Parece que perdiste la conexión. No te preocupes, tu carrito está guardado. Esperaremos a que vuelvas a estar en línea.",
        retryable: true,
      },
    };
  }

  try {
    const response = await fetch("/api/payment/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: payload.reference,
        productId: payload.productId,
        quantity: payload.quantity,
        cardInfo: {
          number: payload.card.number.replace(/\s/g, ""),
          cvv: payload.card.cvc,
          expMonth: payload.card.expiryMonth,
          expYear: payload.card.expiryYear,
          cardHolder: payload.card.holderName,
        },
        deliveryInfo: {
          fullName: `${payload.delivery.firstName} ${payload.delivery.lastName}`,
          email: payload.delivery.email,
          phone: payload.delivery.phone,
          address: payload.delivery.address,
          city: payload.delivery.city,
          postalCode: payload.delivery.postalCode,
        },
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "HTTP_ERROR",
          message: data?.message || "No pudimos procesar el pago en este momento.",
          retryable: response.status >= 500,
        },
      };
    }

    if (!data?.success || !data?.transaction) {
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "La respuesta del servidor de pagos no es válida.",
          retryable: true,
        },
      };
    }

    return { ok: true, value: mapTransaction(data.transaction) };
  } catch {
    return { ok: false, error: toNetworkFailure() };
  }
}

export async function syncTransactionStatusApi(
  reference: string,
): Promise<RopResult<TransactionResult>> {
  try {
    const response = await fetch(`/api/transactions/reference/${reference}/sync`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const backendMessage = String(data?.message || "").toLowerCase();
      const isNotFound =
        response.status === 404 ||
        backendMessage.includes("transaction not found") ||
        backendMessage.includes("transacción no encontrada");
      if (isNotFound) {
        return {
          ok: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message:
              "Aún no encontramos tu transacción. Seguiremos verificando automáticamente.",
            retryable: true,
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "HTTP_ERROR",
          message: data?.message || "No pudimos sincronizar el estado de la transacción.",
          retryable: response.status >= 500,
        },
      };
    }

    if (!data?.success) {
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "No pudimos leer el estado de la transacción en la respuesta del servidor.",
          retryable: true,
        },
      };
    }

    if (!data.transaction) {
      if (data.retryable || data.reason === "NOT_FOUND_YET") {
        return {
          ok: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message:
              "Aún no encontramos tu transacción. Seguiremos verificando automáticamente.",
            retryable: true,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "No recibimos una transacción válida para sincronizar.",
          retryable: true,
        },
      };
    }

    return { ok: true, value: mapTransaction(data.transaction) };
  } catch {
    return { ok: false, error: toNetworkFailure() };
  }
}
