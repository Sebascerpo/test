"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StatusHero } from "@/features/transaction/components/transaction-result/StatusHero";
import { TransactionDetailsCard } from "@/features/transaction/components/transaction-result/TransactionDetailsCard";
import { ResultActions } from "@/features/transaction/components/transaction-result/ResultActions";

interface TransactionResultPageProps {
  onDismiss: (options: {
    showToast: boolean;
    refreshProducts: boolean;
  }) => void;
}

const AUTO_REDIRECT_SECONDS = 5;

export function TransactionResultPage({
  onDismiss,
}: TransactionResultPageProps) {
  const { isOnline } = useNetworkStatus();
  const {
    pendingTransactionReference,
    transactionResult,
    selectedProduct,
    cardPreview,
    deliveryInfo,
    quantity,
  } = useAppSelector((s) => s.payment);

  const effectiveTransaction = useMemo(
    () =>
      transactionResult ??
      (pendingTransactionReference
        ? {
            id: "pending-local",
            transactionNumber: pendingTransactionReference,
            status: "PENDING" as const,
            amount: 0,
          }
        : null),
    [transactionResult, pendingTransactionReference],
  );

  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);
  const didDismissRef = useRef(false);

  const isPending = effectiveTransaction?.status === "PENDING";
  const isApproved = effectiveTransaction?.status === "APPROVED";
  const isDeclined =
    effectiveTransaction?.status === "DECLINED" ||
    effectiveTransaction?.status === "ERROR" ||
    effectiveTransaction?.status === "VOIDED";

  const goToCatalog = useCallback(() => {
    if (didDismissRef.current) return;
    didDismissRef.current = true;
    onDismiss({ showToast: true, refreshProducts: true });
  }, [onDismiss]);

  useEffect(() => {
    if (!effectiveTransaction || isPending) {
      setCountdown(AUTO_REDIRECT_SECONDS);
      setAutoRedirectEnabled(true);
      return;
    }

    setCountdown(AUTO_REDIRECT_SECONDS);
    setAutoRedirectEnabled(true);
  }, [effectiveTransaction, isPending]);

  useEffect(() => {
    if (!effectiveTransaction || isPending || !autoRedirectEnabled) return;

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          goToCatalog();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [effectiveTransaction, isPending, autoRedirectEnabled, goToCatalog]);

  if (!effectiveTransaction) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background px-5 pt-14 pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        className={`pointer-events-none fixed inset-0 -z-10 ${
          isApproved
            ? "bg-emerald-500/10"
            : isDeclined
              ? "bg-red-500/5"
              : "bg-foreground/5"
        }`}
        animate={{
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <StatusHero status={effectiveTransaction.status} isOnline={isOnline} />

      <TransactionDetailsCard
        transaction={effectiveTransaction}
        selectedProduct={selectedProduct}
        quantity={quantity}
        cardPreview={cardPreview}
        deliveryInfo={deliveryInfo}
      />

      <ResultActions
        isPending={isPending}
        countdown={countdown}
        autoRedirectEnabled={autoRedirectEnabled}
        onToggleAutoRedirect={() => setAutoRedirectEnabled((value) => !value)}
        onGoToCatalog={goToCatalog}
      />

      <p className="flex items-center justify-center gap-1.5 text-[11px] mt-6 text-muted-foreground">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Transacción procesada de forma segura
      </p>
    </motion.div>
  );
}
