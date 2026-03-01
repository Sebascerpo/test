"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTransactionResult, setCurrentStep } from "@/store/payment-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftIcon,
  LoaderIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  PackageIcon,
  CheckIcon,
  AlertCircleIcon,
  LockIcon,
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";

// Fees configuration
const FEES = {
  baseFee: 2500,
  deliveryFee: 5000,
};

interface BackdropSummaryProps {
  onBack: () => void;
  onComplete: () => void;
}

export function BackdropSummary({ onBack, onComplete }: BackdropSummaryProps) {
  const dispatch = useAppDispatch();
  const { selectedProduct, quantity, creditCard, deliveryInfo } =
    useAppSelector((state) => state.payment);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePayment = async () => {
    if (!selectedProduct || !creditCard || !deliveryInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      // API is proxied through Next.js to NestJS backend
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: quantity,
          deliveryInfo: {
            fullName: `${deliveryInfo.firstName} ${deliveryInfo.lastName}`,
            email: deliveryInfo.email,
            phone: deliveryInfo.phone,
            address: deliveryInfo.address,
            city: deliveryInfo.city,
            postalCode: deliveryInfo.postalCode,
          },
          cardInfo: {
            number: creditCard.number.replace(/\s/g, ""),
            cvv: creditCard.cvc,
            expMonth: creditCard.expiryMonth,
            expYear: creditCard.expiryYear,
            cardHolder: creditCard.holderName,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al procesar el pago");
      }

      // Save result to Redux store (Flux action)
      dispatch(
        setTransactionResult({
          id: data.transaction.id,
          transactionNumber: data.transaction.reference,
          status: data.transaction.status as
            | "APPROVED"
            | "DECLINED"
            | "ERROR"
            | "PENDING"
            | "VOIDED",
          amount: data.transaction.totalAmount,
          externalTransactionId: data.transaction.externalTransactionId,
          errorMessage: data.transaction.errorMessage || data.message,
        }),
      );

      // Navigate back to product page
      dispatch(setCurrentStep("product"));
      onComplete();
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar el pago",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProduct || !creditCard || !deliveryInfo) {
    return null;
  }

  const totalAmount = selectedProduct.price + FEES.baseFee + FEES.deliveryFee;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop content */}
      <div className="min-h-full flex items-end sm:items-center justify-center p-4">
        <motion.div
          className="w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon size={20} />
                <span className="font-semibold">Resumen de Pago</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={onBack}
                disabled={isLoading}
              >
                <ArrowLeftIcon size={16} className="mr-1" />
                Volver
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Product Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PackageIcon size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cantidad: {quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">
                      {formatPrice(selectedProduct.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCardIcon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Método</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {creditCard.brand}
                        </Badge>
                        <span className="text-xs font-medium">
                          •••• {creditCard.number.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CheckIcon size={16} className="text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TruckIcon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Enviar a</p>
                    <p className="text-sm font-medium truncate">
                      {deliveryInfo.firstName} {deliveryInfo.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deliveryInfo.address}, {deliveryInfo.city}
                    </p>
                  </div>
                  <CheckIcon
                    size={16}
                    className="text-green-500 flex-shrink-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Producto</span>
                  <span>{formatPrice(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa base</span>
                  <span>{formatPrice(FEES.baseFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{formatPrice(FEES.deliveryFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-destructive bg-destructive/10">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircleIcon size={16} />
                        <p className="text-sm font-medium">Error</p>
                      </div>
                      <p className="text-xs text-destructive/80 mt-1">
                        {error}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-background flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 justify-center">
              <LockIcon size={12} />
              <span>Pago 100% seguro</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderIcon size={16} className="mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <LockIcon size={16} className="mr-2" />
                  Pagar {formatPrice(totalAmount)}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
