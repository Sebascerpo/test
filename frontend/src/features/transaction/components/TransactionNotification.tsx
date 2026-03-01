"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  XCircleIcon,
  AlertCircleIcon,
  XIcon,
} from "@/components/icons";

interface TransactionNotificationProps {
  onDismiss: () => void;
}

export function TransactionNotification({
  onDismiss,
}: TransactionNotificationProps) {
  const { transactionResult, selectedProduct } = useAppSelector(
    (s) => s.payment,
  );
  const [visible, setVisible] = useState(true);

  const isApproved = transactionResult?.status === "APPROVED";
  const isPending = transactionResult?.status === "PENDING";
  const duration = isPending ? 12 : 6;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 320);
  }, [onDismiss]);

  useEffect(() => {
    // If it becomes approved or fails, we want it to stay a bit longer to be seen
    // but not forever.
    if (!isPending) {
      const t = setTimeout(handleDismiss, 6000);
      return () => clearTimeout(t);
    }
    // If pending, it stays for the duration or until status changes
    const t = setTimeout(handleDismiss, duration * 1000);
    return () => clearTimeout(t);
  }, [handleDismiss, duration, isPending]);

  if (!transactionResult) return null;

  const Icon = isApproved
    ? CheckIcon
    : isPending
      ? AlertCircleIcon
      : XCircleIcon;
  const iconBg = isApproved
    ? "bg-foreground text-background"
    : isPending
      ? "bg-muted text-foreground/60 border border-border"
      : "bg-destructive/10 text-destructive border border-destructive/20";
  const label = isApproved
    ? "Pago aprobado"
    : isPending
      ? "En verificación"
      : "Pago rechazado";
  const labelColor = isApproved
    ? "text-foreground"
    : isPending
      ? "text-muted-foreground"
      : "text-destructive";

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: import.meta.env.VITE_CURRENCY || "COP",
      minimumFractionDigits: 0,
    }).format(p);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="fixed top-[60px] left-3 right-3 z-[70] md:left-auto md:right-4 md:w-[360px]"
        >
          <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
              >
                <Icon size={14} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] font-semibold leading-none ${labelColor}`}
                >
                  {label}
                </p>
                {selectedProduct && (
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {selectedProduct.name}
                  </p>
                )}
              </div>

              {/* Amount */}
              <p className="text-sm font-semibold flex-shrink-0">
                {formatPrice(transactionResult.amount)}
              </p>

              {/* Close */}
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
              >
                <XIcon size={11} />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              className="h-[2px] bg-foreground/15 origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
