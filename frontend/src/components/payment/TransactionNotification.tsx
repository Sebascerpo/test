"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { reset, setTransactionResult } from "@/store/payment-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  XIcon,
  LoaderIcon,
  ShoppingBagIcon,
} from "@/components/icons";

interface TransactionNotificationProps {
  onDismiss: () => void;
}

export function TransactionNotification({
  onDismiss,
}: TransactionNotificationProps) {
  const dispatch = useAppDispatch();
  const { transactionResult, selectedProduct } = useAppSelector(
    (state) => state.payment,
  );
  const [isVisible, setIsVisible] = useState(true);

  const isSuccess = transactionResult?.status === "APPROVED";
  const isPending = transactionResult?.status === "PENDING";

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      dispatch(reset());
      onDismiss();
    }, 300);
  }, [dispatch, onDismiss]);

  const handleSyncStatus = useCallback(async () => {
    if (!transactionResult || transactionResult.status !== "PENDING") return;

    try {
      const response = await fetch(
        `/api/transactions/reference/${transactionResult.transactionNumber}/sync`,
      );
      const data = await response.json();

      if (data.success && data.updated) {
        dispatch(
          setTransactionResult({
            id: data.transaction.id,
            transactionNumber: data.transaction.reference,
            status: data.transaction.status,
            amount: data.transaction.totalAmount,
            externalTransactionId: data.transaction.externalTransactionId,
            errorMessage: data.transaction.errorMessage,
          }),
        );
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  }, [transactionResult, dispatch]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPending) {
      interval = setInterval(handleSyncStatus, 5000);
    }

    // Auto-dismiss after 15 seconds if it stays pending, or 8 if success/error
    const timer = setTimeout(handleDismiss, isPending ? 15000 : 8000);

    return () => {
      if (interval) clearInterval(interval);
      clearTimeout(timer);
    };
  }, [handleDismiss, isPending, handleSyncStatus]);

  if (!transactionResult) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: import.meta.env.VITE_CURRENCY || "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = () => {
    if (isSuccess) return "green";
    if (isPending) return "amber";
    return "red";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div
            className={`rounded-lg shadow-xl border overflow-hidden ${
              isSuccess
                ? "bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700"
                : isPending
                  ? "bg-amber-50 dark:bg-amber-900/90 border-amber-200 dark:border-amber-700"
                  : "bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-3 ${
                isSuccess
                  ? "bg-green-100 dark:bg-green-800"
                  : isPending
                    ? "bg-amber-100 dark:bg-amber-800"
                    : "bg-red-100 dark:bg-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckIcon size={12} className="text-white" />
                  </div>
                ) : isPending ? (
                  <LoaderIcon
                    size={20}
                    className="text-amber-600 dark:text-amber-300 animate-spin"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <XIcon size={12} className="text-white" />
                  </div>
                )}
                <span
                  className={`font-semibold text-sm ${
                    isSuccess
                      ? "text-green-700 dark:text-green-200"
                      : isPending
                        ? "text-amber-700 dark:text-amber-200"
                        : "text-red-700 dark:text-red-200"
                  }`}
                >
                  {isSuccess
                    ? "¡Pago Exitoso!"
                    : isPending
                      ? "Pago en Proceso"
                      : "Pago No Completado"}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className={`p-1 rounded-full hover:bg-black/10 transition-colors ${
                  isSuccess
                    ? "text-green-600 dark:text-green-300"
                    : isPending
                      ? "text-amber-600 dark:text-amber-300"
                      : "text-red-600 dark:text-red-300"
                }`}
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {selectedProduct && (
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingBagIcon
                    size={16}
                    className={
                      isSuccess
                        ? "text-green-500"
                        : isPending
                          ? "text-amber-500"
                          : "text-red-500"
                    }
                  />
                  <span className="truncate flex-1">
                    {selectedProduct.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">
                  {formatPrice(transactionResult.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Referencia:</span>
                <span className="font-mono">
                  {transactionResult.transactionNumber}
                </span>
              </div>

              {transactionResult.errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {transactionResult.errorMessage}
                </p>
              )}

              {isSuccess && (
                <div className="pt-2 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs text-green-600 dark:text-green-300">
                    Recibirás un correo de confirmación. Tu pedido será enviado
                    en 24-48 horas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
