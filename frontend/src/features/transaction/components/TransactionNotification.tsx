"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckIcon,
  XCircleIcon,
  AlertCircleIcon,
  XIcon,
} from "@/components/icons";
import { transitions } from "@/lib/motion";

interface TransactionNotificationProps {
  onDismiss: () => void;
}

export function TransactionNotification({
  onDismiss,
}: TransactionNotificationProps) {
  const { transactionResult, selectedProduct } = useAppSelector(
    (s) => s.payment,
  );
  const shouldReduceMotion = useReducedMotion();
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

  const toneClass = isApproved
    ? "toast--approved"
    : isPending
      ? "toast--pending"
      : "toast--declined";
  const { Icon, label } = isApproved
    ? { Icon: CheckIcon, label: "Pago aprobado" }
    : isPending
      ? { Icon: AlertCircleIcon, label: "En verificación" }
      : { Icon: XCircleIcon, label: "Pago rechazado" };

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
          initial={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : -10,
            scale: shouldReduceMotion ? 1 : 0.97,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : -10,
            scale: shouldReduceMotion ? 1 : 0.97,
          }}
          transition={transitions.enterFadeUp(!!shouldReduceMotion)}
          className="fixed top-[60px] left-3 right-3 z-[70] md:left-auto md:right-4 md:w-[360px]"
        >
          <div className={`status-toast-card toast-tone ${toneClass}`}>
            <div className="status-toast-accent" />
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Icon */}
              <div className="status-toast-icon w-8 h-8 rounded-xl">
                <Icon size={14} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="status-toast-label text-[13px] font-semibold leading-none">
                  {label}
                </p>
                {selectedProduct && (
                  <p className="status-toast-meta text-[11px] mt-1 truncate">
                    {selectedProduct.name}
                  </p>
                )}
              </div>

              {/* Amount */}
              <p className="status-toast-label text-sm font-semibold flex-shrink-0">
                {formatPrice(transactionResult.amount)}
              </p>

              {/* Close */}
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full bg-white/50 hover:bg-white/70 dark:bg-black/25 dark:hover:bg-black/35 border border-white/60 dark:border-white/10 flex items-center justify-center status-toast-meta hover:text-[color:var(--toast-fg)] transition-all duration-150 [transition-timing-function:var(--ease-smooth)] flex-shrink-0"
              >
                <XIcon size={11} />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              className="status-toast-progress h-[2px] origin-left"
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
