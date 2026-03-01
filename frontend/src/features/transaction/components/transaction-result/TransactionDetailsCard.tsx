import {
  CardPreview,
  DeliveryInfo,
  Product,
  TransactionResult,
} from "@/store/payment-store";
import { motion } from "framer-motion";

const APP_CURRENCY = import.meta.env.VITE_CURRENCY || "COP";

const fmt = (p: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: APP_CURRENCY,
    minimumFractionDigits: 0,
  }).format(p);

interface TransactionDetailsCardProps {
  transaction: TransactionResult;
  selectedProduct: Product | null;
  quantity: number;
  cardPreview: CardPreview | null;
  deliveryInfo: DeliveryInfo | null;
}

export function TransactionDetailsCard({
  transaction,
  selectedProduct,
  quantity,
  cardPreview,
  deliveryInfo,
}: TransactionDetailsCardProps) {
  const isDeclined =
    transaction.status === "DECLINED" ||
    transaction.status === "ERROR" ||
    transaction.status === "VOIDED";

  return (
    <motion.div
      className="w-full max-w-sm mt-6 mx-auto"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-premium">
        {selectedProduct && (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {selectedProduct.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cantidad: {quantity}
              </p>
            </div>
            <p className="text-sm font-semibold flex-shrink-0">
              {transaction.amount > 0
                ? fmt(transaction.amount)
                : "Por confirmar"}
            </p>
          </div>
        )}

        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Referencia</span>
            <span className="text-xs font-mono text-foreground/80 truncate max-w-[160px] text-right">
              {transaction.transactionNumber}
            </span>
          </div>

          {transaction.externalTransactionId && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ID externo</span>
              <span className="text-xs font-mono text-foreground/80 truncate max-w-[160px] text-right">
                {transaction.externalTransactionId}
              </span>
            </div>
          )}

          {cardPreview && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tarjeta</span>
              <span className="text-xs text-foreground/80 text-right">
                {cardPreview.brand} •••• {cardPreview.last4 || "----"}
              </span>
            </div>
          )}

          {deliveryInfo && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Ciudad de envío
              </span>
              <span className="text-xs text-foreground/80 text-right">
                {deliveryInfo.city}
              </span>
            </div>
          )}
        </div>

        <div
          className={`mx-4 mb-4 rounded-xl p-3 ${
            isDeclined
              ? "bg-red-50 border border-red-200"
              : "bg-muted border border-border"
          }`}
        >
          <p
            className={`text-[11px] leading-relaxed ${
              isDeclined ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {transaction.status === "APPROVED"
              ? `Confirmación enviada a ${deliveryInfo?.email ?? "tu correo"}. Entrega estimada en 24–48 horas.`
              : transaction.status === "PENDING"
                ? "Seguimos verificando el estado del pago. Puedes esperar aquí o volver al catálogo."
                : (transaction.errorMessage ??
                  "Verifica los datos e inténtalo nuevamente.")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
