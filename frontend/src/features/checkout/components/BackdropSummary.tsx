import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  PackageIcon,
  CheckIcon,
  LockIcon,
  RefreshIcon,
  WifiOffIcon,
} from "@/components/icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { processPayment } from "@/store/payment-store";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ValidationToast } from "@/components/ui/ValidationToast";
import { transitions } from "@/lib/motion";
import { useAppConfig } from "@/lib/app-config";
import { SummaryRow } from "@/features/checkout/components/summary/SummaryRow";

interface BackdropSummaryProps {
  onBack: () => void;
}

const fmt = (p: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(p);

export function BackdropSummary({ onBack }: BackdropSummaryProps) {
  const dispatch = useAppDispatch();
  const { isOnline } = useNetworkStatus();
  const shouldReduceMotion = useReducedMotion();
  const appConfig = useAppConfig();
  const {
    selectedProduct,
    quantity,
    cardPreview,
    sensitiveSession,
    deliveryInfo,
    isLoading,
    error,
  } = useAppSelector((s) => s.payment);
  const [tapped, setTapped] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setToastMessage(
        "Parece que perdiste la conexión. No te preocupes, tu carrito está guardado. Esperaremos a que vuelvas a estar en línea.",
      );
      return;
    }
    setToastMessage(null);
  }, [isOnline]);

  if (!selectedProduct || !cardPreview || !deliveryInfo) return null;

  const productTotal = selectedProduct.price * quantity;
  const total = productTotal + appConfig.baseFee + appConfig.deliveryFee;

  const handlePay = async () => {
    if (tapped || !isOnline || isLoading) return;
    setTapped(true);

    // ── Step 1: Fire ROP-style API call via Thunk ────────────────────────────
    const action = await dispatch(
      processPayment({ card: sensitiveSession.card || undefined }),
    );
    if (processPayment.fulfilled.match(action) && action.payload.success) {
      return;
    }

    setTapped(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.enterFadeUp(!!shouldReduceMotion)}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        className="relative bg-background rounded-t-[24px] shadow-premium border-t border-border flex flex-col overflow-hidden"
        style={{ maxHeight: "92svh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={transitions.sheetSpring(!!shouldReduceMotion)}
      >
        <ValidationToast
          message={toastMessage}
          onClear={() => setToastMessage(null)}
          tone={isOnline ? "declined" : "pending"}
        />

        {/* Handle */}
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-border surface-1 flex items-center justify-between">
          <div>
            <p className="sc-label">Confirmar pedido</p>
            <h2 className="text-[17px] font-semibold tracking-tight">
              Resumen de pago
            </h2>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 [transition-timing-function:var(--ease-smooth)] active:scale-[0.98]"
          >
            <ArrowLeftIcon size={13} />
            Editar
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sheet-scroll overscroll-contain px-5 py-5 space-y-4">
          {/* Product */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted border border-border">
            <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
              <PackageIcon size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {selectedProduct.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cantidad: {quantity}
              </p>
            </div>
            <p className="font-semibold text-sm flex-shrink-0">
              {fmt(selectedProduct.price, appConfig.currency)}
            </p>
          </div>

          {/* Payment + Delivery */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CreditCardIcon size={11} className="text-muted-foreground" />
                <p className="sc-label !mb-0">Tarjeta</p>
              </div>
              <p className="text-sm font-semibold">{cardPreview.brand}</p>
              <p className="text-xs text-muted-foreground font-mono">
                •••• {cardPreview.last4 || "----"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                  <CheckIcon size={8} className="text-background" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Verificado
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <TruckIcon size={11} className="text-muted-foreground" />
                <p className="sc-label !mb-0">Envío</p>
              </div>
              <p className="text-sm font-semibold truncate">
                {deliveryInfo.firstName} {deliveryInfo.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {deliveryInfo.address}
              </p>
              <p className="text-xs text-muted-foreground">
                {deliveryInfo.city}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-border px-4 py-1 surface-elevated shadow-xs">
            <SummaryRow
              label={`Producto (${quantity})`}
              value={fmt(selectedProduct.price * quantity, appConfig.currency)}
            />
            <SummaryRow
              label="Tarifa de servicio"
              value={fmt(appConfig.baseFee, appConfig.currency)}
            />
            <SummaryRow
              label="Costo de envío"
              value={fmt(appConfig.deliveryFee, appConfig.currency)}
            />
            <SummaryRow label="Total" value={fmt(total, appConfig.currency)} total />
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-3 pb-1">
            {["Pago seguro", "SSL 256-bit", "Datos cifrados"].map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                  <CheckIcon size={7} className="text-background" />
                </div>
                <span className="text-[11px] text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border surface-1 bg-background">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <ShieldCheckIcon size={11} className="text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Transacción segura y encriptada
            </p>
          </div>

          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5"
              >
                <WifiOffIcon size={16} className="text-orange-500" />
                <p className="text-xs text-orange-600 font-medium leading-tight">
                  Parece que perdiste la conexión. No te preocupes, guardamos tu
                  progreso.
                </p>
              </motion.div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transitions.enterFadeUp(!!shouldReduceMotion)}
                className="text-center text-[11px] text-red-500 mb-2 font-medium"
              >
                {error}
              </motion.p>
            )}
            {!sensitiveSession.card && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transitions.enterFadeUp(!!shouldReduceMotion)}
                className="text-center text-[11px] text-amber-600 mb-2 font-medium"
              >
                Por seguridad debes reingresar número de tarjeta y CVC antes de
                pagar.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handlePay}
            disabled={tapped || !isOnline || isLoading}
            className={`sc-btn-primary sc-btn-pay ${!isOnline || tapped || isLoading ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
            whileTap={
              isOnline && !isLoading && !shouldReduceMotion
                ? transitions.buttonPress
                : {}
            }
          >
            {isLoading ? (
              <RefreshIcon size={15} className="animate-spin" />
            ) : !isOnline ? (
              <WifiOffIcon size={15} />
            ) : (
              <LockIcon size={15} />
            )}
            {isLoading
              ? "Procesando..."
              : !isOnline
                ? "Sin conexión"
                : `Pagar ${fmt(total, appConfig.currency)}`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
