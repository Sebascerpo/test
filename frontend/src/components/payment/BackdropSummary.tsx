"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTransactionResult, setCurrentStep } from "@/store/payment-store";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  PackageIcon,
  CheckIcon,
  LockIcon,
} from "@/components/icons";
import { motion } from "framer-motion";

const FEES = {
  baseFee: Number(import.meta.env.VITE_BASE_FEE || 2500),
  deliveryFee: Number(import.meta.env.VITE_DELIVERY_FEE || 5000),
};
const APP_CURRENCY = import.meta.env.VITE_CURRENCY || "COP";

interface BackdropSummaryProps {
  onBack: () => void;
  onComplete: () => void;
}

const fmt = (p: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: APP_CURRENCY,
    minimumFractionDigits: 0,
  }).format(p);

function Row({
  label,
  value,
  total,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-border last:border-0 ${
        total ? "font-semibold" : ""
      }`}
    >
      <span className={total ? "text-[15px]" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span className={total ? "text-[18px] tracking-tight" : "text-sm"}>
        {value}
      </span>
    </div>
  );
}

export function BackdropSummary({ onBack, onComplete }: BackdropSummaryProps) {
  const dispatch = useAppDispatch();
  const { selectedProduct, quantity, creditCard, deliveryInfo } =
    useAppSelector((s) => s.payment);
  const [tapped, setTapped] = useState(false);

  if (!selectedProduct || !creditCard || !deliveryInfo) return null;

  const productTotal = selectedProduct.price * quantity;
  const total = productTotal + FEES.baseFee + FEES.deliveryFee;

  const handlePay = () => {
    if (tapped) return;
    setTapped(true);

    // ── Step 1: Navigate to result page IMMEDIATELY with PENDING status ──────
    dispatch(
      setTransactionResult({
        id: "pending-optimistic",
        transactionNumber: "...",
        status: "PENDING",
        amount: total,
      }),
    );
    dispatch(setCurrentStep("result"));
    onComplete();

    // ── Step 2: Fire API call in background, update result when it returns ───
    const payload = {
      productId: selectedProduct.id,
      quantity,
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
    };

    fetch("/api/payment/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        dispatch(
          setTransactionResult({
            id: data.transaction?.id ?? "error",
            transactionNumber: data.transaction?.reference ?? "N/A",
            status:
              data.success && data.transaction?.status
                ? data.transaction.status
                : "ERROR",
            amount: data.transaction?.totalAmount ?? total,
            externalTransactionId: data.transaction?.externalTransactionId,
            errorMessage: !data.success
              ? data.message || "Error al procesar el pago"
              : data.transaction?.errorMessage,
          }),
        );
      })
      .catch((err) => {
        dispatch(
          setTransactionResult({
            id: "error",
            transactionNumber: "N/A",
            status: "ERROR",
            amount: total,
            errorMessage:
              err instanceof Error ? err.message : "Error de conexión",
          }),
        );
      });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        className="relative bg-background rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92svh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="sc-label">Confirmar pedido</p>
            <h2 className="text-[17px] font-semibold tracking-tight">
              Resumen de pago
            </h2>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon size={13} />
            Editar
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sheet-scroll px-5 py-5 space-y-4">
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
              {fmt(selectedProduct.price)}
            </p>
          </div>

          {/* Payment + Delivery */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CreditCardIcon size={11} className="text-muted-foreground" />
                <p className="sc-label !mb-0">Tarjeta</p>
              </div>
              <p className="text-sm font-semibold">{creditCard.brand}</p>
              <p className="text-xs text-muted-foreground font-mono">
                •••• {creditCard.number.slice(-4)}
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
          <div className="rounded-2xl border border-border px-4 py-1">
            <Row
              label={`Producto (${quantity})`}
              value={fmt(selectedProduct.price * quantity)}
            />
            <Row label="Tarifa de servicio" value={fmt(FEES.baseFee)} />
            <Row label="Costo de envío" value={fmt(FEES.deliveryFee)} />
            <Row label="Total" value={fmt(total)} total />
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-3">
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
        <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-background">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <ShieldCheckIcon size={11} className="text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Transacción segura y encriptada
            </p>
          </div>
          <motion.button
            onClick={handlePay}
            disabled={tapped}
            className="sc-btn-primary"
            whileTap={{ scale: 0.98 }}
          >
            <LockIcon size={15} />
            Pagar {fmt(total)}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
