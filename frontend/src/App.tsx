import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentStep, reset } from "@/store/payment-store";
import { ProductCatalog } from "@/components/payment/ProductCatalog";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { BackdropSummary } from "@/components/payment/BackdropSummary";
import { TransactionNotification } from "@/components/payment/TransactionNotification";
import { CreditCardIcon, ShieldCheckIcon } from "@/components/icons";
import { useCallback } from "react";

function AppContent() {
  const dispatch = useAppDispatch();
  const {
    currentStep,
    selectedProduct,
    transactionResult,
    creditCard,
    deliveryInfo,
  } = useAppSelector((state) => state.payment);

  // UI state - derive from store state (Flux pattern: UI is derived from state)
  const showPaymentModal = currentStep === "payment-info" && !!selectedProduct;
  const showBackdrop =
    currentStep === "summary" &&
    !!selectedProduct &&
    !!creditCard &&
    !!deliveryInfo;
  const showNotification = currentStep === "product" && !!transactionResult;

  // Actions - dispatch to store (Flux: actions flow through dispatcher)
  const handleProductSelect = useCallback(() => {
    dispatch(setCurrentStep("payment-info"));
  }, [dispatch]);

  const handlePaymentComplete = useCallback(() => {
    dispatch(setCurrentStep("summary"));
  }, [dispatch]);

  const handleModalClose = useCallback(
    (open: boolean) => {
      if (!open) {
        dispatch(setCurrentStep("product"));
      }
    },
    [dispatch],
  );

  const handleBackdropBack = useCallback(() => {
    dispatch(setCurrentStep("payment-info"));
  }, [dispatch]);

  const handlePaymentResult = useCallback(() => {
    dispatch(setCurrentStep("product"));
  }, [dispatch]);

  const handleNotificationDismiss = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              SC
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              SEBASCERPO
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon size={16} />
            <span className="hidden sm:inline">Pago Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Content - Always show Product Catalog */}
      <main className="flex-1 flex flex-col relative">
        {/* Transaction Notification - Shows above products after payment */}
        {showNotification && transactionResult && (
          <TransactionNotification onDismiss={handleNotificationDismiss} />
        )}

        {/* Product Catalog - Always visible, dimmed when modal/backdrop open */}
        <div
          className={
            showPaymentModal || showBackdrop
              ? "pointer-events-none opacity-30"
              : ""
          }
        >
          <ProductCatalog onSelectProduct={handleProductSelect} />
        </div>

        {/* Payment Modal */}
        {selectedProduct && (
          <PaymentModal
            open={showPaymentModal}
            onOpenChange={handleModalClose}
            product={selectedProduct}
            onComplete={handlePaymentComplete}
          />
        )}

        {/* Backdrop Summary */}
        {showBackdrop && (
          <BackdropSummary
            onBack={handleBackdropBack}
            onComplete={handlePaymentResult}
            // @ts-ignore
            onResult={handlePaymentResult}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-slate-50 dark:bg-slate-900/50 py-3 mt-auto relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">SEBASCERPO</span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ShieldCheckIcon size={12} />
                <span>SSL Seguro</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">
                Pagos seguros
              </span>
              <div className="flex items-center gap-1">
                <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">
                  VISA
                </div>
                <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">
                  MC
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
