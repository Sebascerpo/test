import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setCurrentStep,
  reset,
  setTransactionResult,
} from "@/store/payment-store";
import { ProductCatalog } from "@/components/payment/ProductCatalog";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { BackdropSummary } from "@/components/payment/BackdropSummary";
import { TransactionResultPage } from "@/components/payment/TransactionResultPage";
import { TransactionNotification } from "@/components/payment/TransactionNotification";
import { ShieldCheckIcon } from "@/components/icons";
import { useCallback, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

function AppContent() {
  const dispatch = useAppDispatch();
  const {
    currentStep,
    selectedProduct,
    transactionResult,
    creditCard,
    deliveryInfo,
  } = useAppSelector((state) => state.payment);

  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useCallback(() => {
    // We'll use a local ref for the interval to avoid re-renders
  }, []);

  // Toast shown ONLY when user leaves result page — never on immediate completion
  const [showToast, setShowToast] = useState(false);

  const showPaymentModal = currentStep === "payment-info" && !!selectedProduct;
  const showBackdrop =
    currentStep === "summary" &&
    !!selectedProduct &&
    !!creditCard &&
    !!deliveryInfo;
  const showResultPage = currentStep === "result" && !!transactionResult;
  const showNotification =
    currentStep === "product" && !!transactionResult && showToast;

  const handleProductSelect = useCallback(() => {
    dispatch(setCurrentStep("payment-info"));
  }, [dispatch]);

  const handlePaymentComplete = useCallback(() => {
    dispatch(setCurrentStep("summary"));
  }, [dispatch]);

  const handleModalClose = useCallback(
    (open: boolean) => {
      if (!open) dispatch(setCurrentStep("product"));
    },
    [dispatch],
  );

  const handleBackdropBack = useCallback(() => {
    dispatch(setCurrentStep("payment-info"));
  }, [dispatch]);

  // BackdropSummary already sets step to "result" — nothing to do here
  const handlePaymentResult = useCallback(() => {}, []);

  // Result page → user taps dismiss → trigger toast on product page
  const handleResultDismiss = useCallback((triggerToast: boolean) => {
    if (triggerToast) setShowToast(true);
    // reset() is dispatched inside TransactionResultPage before calling this
  }, []);

  // ── Polling logic (Centralized) ──────────────────────────────────────────────
  const syncStatus = useCallback(async () => {
    if (
      transactionResult?.status !== "PENDING" ||
      !transactionResult.transactionNumber ||
      transactionResult.transactionNumber === "..."
    )
      return;

    setIsSyncing(true);
    try {
      const res = await fetch(
        `/api/transactions/reference/${transactionResult.transactionNumber}/sync`,
      );
      const data = await res.json();
      if (data.success && data.transaction) {
        const newStatus = data.transaction.status;
        if (newStatus !== transactionResult.status) {
          dispatch(
            setTransactionResult({
              id: data.transaction.id,
              transactionNumber: data.transaction.reference,
              status: newStatus,
              amount: data.transaction.totalAmount,
              externalTransactionId: data.transaction.externalTransactionId,
              errorMessage: data.transaction.errorMessage,
            }),
          );
        }
      }
    } catch (err) {
      console.warn("[APP] Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [transactionResult, dispatch]);

  useState(() => {
    // Initial sync setup is handled by the useEffect below
  });

  useEffect(() => {
    if (transactionResult?.status !== "PENDING") return;

    // First check after 2s
    const firstSync = setTimeout(syncStatus, 2000);
    // Then every 5s
    const interval = setInterval(syncStatus, 5000);

    return () => {
      clearTimeout(firstSync);
      clearInterval(interval);
    };
  }, [
    transactionResult?.status,
    transactionResult?.transactionNumber,
    syncStatus,
  ]);

  const handleNotificationDismiss = useCallback(() => {
    setShowToast(false);
    dispatch(reset());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs tracking-tight">
                SC
              </span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight hidden sm:inline">
              SEBASCERPO
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheckIcon size={13} />
            <span>Pago seguro</span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative">
        {/* Toast — appears after leaving result page */}
        {showNotification && transactionResult && (
          <TransactionNotification onDismiss={handleNotificationDismiss} />
        )}

        {/* Product catalog — dimmed while checkout is open */}
        <div
          className={
            showPaymentModal || showBackdrop
              ? "pointer-events-none opacity-40 transition-opacity"
              : "transition-opacity"
          }
        >
          <ProductCatalog onSelectProduct={handleProductSelect} />
        </div>

        {/* Step: payment-info */}
        {selectedProduct && (
          <PaymentModal
            open={showPaymentModal}
            onOpenChange={handleModalClose}
            product={selectedProduct}
            onComplete={handlePaymentComplete}
          />
        )}

        {/* Step: summary */}
        {showBackdrop && (
          <BackdropSummary
            onBack={handleBackdropBack}
            onComplete={handlePaymentResult}
          />
        )}

        {/* Step: result — full-screen */}
        <AnimatePresence>
          {showResultPage && (
            <TransactionResultPage onDismiss={handleResultDismiss} />
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="w-full border-t border-border py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">SEBASCERPO</span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <ShieldCheckIcon size={11} /> SSL seguro
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Pagos seguros</span>
            {["VISA", "MC", "AMEX"].map((b) => (
              <span
                key={b}
                className="px-2 py-0.5 border border-border rounded text-[10px] font-semibold text-foreground/60"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
