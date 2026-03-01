import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setCurrentStep,
  reset,
} from "@/store/payment-store";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePendingTransactionRecovery } from "@/hooks/usePendingTransactionRecovery";
import { ProductCatalog } from "@/features/catalog/components/ProductCatalog";
import { PaymentModal } from "@/features/checkout/components/PaymentModal";
import { BackdropSummary } from "@/features/checkout/components/BackdropSummary";
import { TransactionResultPage } from "@/features/transaction/components/TransactionResultPage";
import { TransactionNotification } from "@/features/transaction/components/TransactionNotification";
import { ShieldCheckIcon } from "@/components/icons";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function AppContent() {
  const dispatch = useAppDispatch();
  const {
    currentStep,
    selectedProduct,
    pendingTransactionReference,
    transactionResult,
    cardPreview,
    deliveryInfo,
  } = useAppSelector((state) => state.payment);

  const { isOnline } = useNetworkStatus();
  usePendingTransactionRecovery();

  // Toast shown ONLY when user leaves result page — never on immediate completion
  const [showToast, setShowToast] = useState(false);
  const [catalogRefreshSignal, setCatalogRefreshSignal] = useState(0);

  const showPaymentModal = currentStep === "payment-info" && !!selectedProduct;
  const showBackdrop =
    currentStep === "summary" &&
    !!selectedProduct &&
    !!cardPreview &&
    !!deliveryInfo;
  const showResultPage =
    currentStep === "result" &&
    (!!transactionResult || !!pendingTransactionReference);
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

  const handleResultDismiss = useCallback(
    (options: { showToast: boolean; refreshProducts: boolean }) => {
      if (options.showToast) {
        setShowToast(true);
      }
      if (options.refreshProducts) {
        setCatalogRefreshSignal((value) => value + 1);
      }
      dispatch(setCurrentStep("product"));
    },
    [dispatch],
  );

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

        {/* Offline feedback */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-orange-500/95 text-white text-xs font-medium shadow-xl backdrop-blur flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Sin conexión — Verificaremos tu pago al volver
          </motion.div>
        )}

        {/* Product catalog — dimmed while checkout is open */}
        <div
          className={
            showPaymentModal || showBackdrop
              ? "pointer-events-none opacity-40 transition-opacity"
              : "transition-opacity"
          }
        >
          <ProductCatalog
            onSelectProduct={handleProductSelect}
            refreshSignal={catalogRefreshSignal}
          />
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
