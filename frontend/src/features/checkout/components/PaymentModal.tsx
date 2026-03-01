"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Product,
  setCardEntryComplete,
  setCardPreview,
  setCurrentStep,
  setDeliveryInfo,
  setRuntimeCard,
  formatCardNumber,
  detectCardBrand,
  validateCardNumber,
  validateCVC,
  validateExpiryDate,
} from "@/store/payment-store";
import {
  CheckIcon,
  CreditCardIcon,
  TruckIcon,
  XIcon,
} from "@/components/icons";
import { ValidationToast } from "@/components/ui/ValidationToast";
import { FEES } from "@/lib/payment-provider";
import { CardFormSection } from "@/features/checkout/components/payment-modal/CardFormSection";
import {
  DeliveryFormSection,
  DeliveryFormValues,
} from "@/features/checkout/components/payment-modal/DeliveryFormSection";
import { ModalFooter } from "@/features/checkout/components/payment-modal/ModalFooter";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onComplete: () => void;
}

const fmt = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

export function PaymentModal({
  open,
  onOpenChange,
  product,
  onComplete,
}: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const {
    cardPreview,
    deliveryInfo: savedDelivery,
    quantity,
  } = useAppSelector((s) => s.payment);

  const [tab, setTab] = useState<"card" | "delivery">("card");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState(cardPreview?.holderName || "");
  const [expiry, setExpiry] = useState(
    cardPreview ? `${cardPreview.expiryMonth}/${cardPreview.expiryYear}` : "",
  );
  const [cvc, setCvc] = useState("");
  const [brand, setBrand] = useState(cardPreview?.brand || "UNKNOWN");
  const [showCvc, setShowCvc] = useState(false);

  const [deliveryValues, setDeliveryValues] = useState<DeliveryFormValues>({
    firstName: savedDelivery?.firstName || "",
    lastName: savedDelivery?.lastName || "",
    email: savedDelivery?.email || "",
    phone: savedDelivery?.phone || "",
    docType: savedDelivery?.documentType || "CC",
    docNumber: savedDelivery?.documentNumber || "",
    address: savedDelivery?.address || "",
    city: savedDelivery?.city || "",
    state: savedDelivery?.state || "",
    postalCode: savedDelivery?.postalCode || "",
    additionalInfo: savedDelivery?.additionalInfo || "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    dispatch(
      setDeliveryInfo({
        firstName: deliveryValues.firstName,
        lastName: deliveryValues.lastName,
        email: deliveryValues.email,
        phone: deliveryValues.phone,
        documentType: deliveryValues.docType,
        documentNumber: deliveryValues.docNumber,
        address: deliveryValues.address,
        city: deliveryValues.city,
        state: deliveryValues.state,
        postalCode: deliveryValues.postalCode,
        additionalInfo: deliveryValues.additionalInfo,
      }),
    );
  }, [deliveryValues, dispatch]);

  useEffect(() => {
    const [expiryMonth = "", expiryYear = ""] = expiry.split("/");
    const cleanedNumber = cardNumber.replace(/\s/g, "");
    const hasSomeCardSignal =
      holderName.trim().length > 0 ||
      cleanedNumber.length > 0 ||
      expiry.length > 0;

    if (!hasSomeCardSignal) {
      dispatch(setCardPreview(null));
      dispatch(setCardEntryComplete(false));
      return;
    }

    dispatch(
      setCardPreview({
        brand,
        last4: cleanedNumber.slice(-4),
        holderName,
        expiryMonth,
        expiryYear,
      }),
    );
    dispatch(setCardEntryComplete(false));
  }, [dispatch, cardNumber, holderName, expiry, brand]);

  const handleCardNumber = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, "").length <= 19) {
      setCardNumber(formatted);
      setBrand(detectCardBrand(value));
    }
  };

  const handleExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setExpiry(
      digits.length >= 2
        ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
        : digits,
    );
  };

  const cardValid = () => {
    const [month, year] = expiry.split("/");
    return (
      validateCardNumber(cardNumber) &&
      holderName.trim().length >= 5 &&
      validateExpiryDate(month || "", year || "") &&
      validateCVC(cvc)
    );
  };

  const deliveryValid = () =>
    deliveryValues.firstName.trim().length >= 2 &&
    deliveryValues.lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryValues.email) &&
    deliveryValues.phone.trim().length >= 7 &&
    deliveryValues.docNumber.trim().length >= 5 &&
    deliveryValues.address.trim().length >= 5 &&
    deliveryValues.city.trim().length >= 2;

  const handleContinue = () => {
    if (tab === "card") {
      if (!validateCardNumber(cardNumber)) {
        showToast("El número de tarjeta es inválido");
        return;
      }
      if (holderName.trim().length < 5) {
        showToast("Ingresa el nombre completo del titular");
        return;
      }
      const [month, year] = expiry.split("/");
      if (!validateExpiryDate(month || "", year || "")) {
        showToast("La fecha de expiración es inválida");
        return;
      }
      if (!validateCVC(cvc)) {
        showToast("El CVC es inválido (3-4 dígitos)");
        return;
      }
      setTab("delivery");
      return;
    }

    if (!deliveryValid()) {
      if (deliveryValues.firstName.trim().length < 2) {
        showToast("El nombre es muy corto");
        return;
      }
      if (deliveryValues.lastName.trim().length < 2) {
        showToast("El apellido es muy corto");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryValues.email)) {
        showToast("El correo electrónico es inválido");
        return;
      }
      if (deliveryValues.phone.trim().length < 7) {
        showToast("El teléfono debe tener al menos 7 dígitos");
        return;
      }
      if (deliveryValues.docNumber.trim().length < 5) {
        showToast("El número de documento es inválido");
        return;
      }
      if (deliveryValues.address.trim().length < 5) {
        showToast("La dirección es muy corta");
        return;
      }
      showToast("Ingresa una ciudad válida");
      return;
    }

    const [expiryMonth = "", expiryYear = ""] = expiry.split("/");
    const cleanedNumber = cardNumber.replace(/\s/g, "");

    dispatch(
      setRuntimeCard({
        number: cleanedNumber,
        holderName,
        expiryMonth,
        expiryYear,
        cvc,
        brand,
      }),
    );
    dispatch(setCardEntryComplete(true));
    dispatch(
      setCardPreview({
        brand,
        last4: cleanedNumber.slice(-4),
        holderName,
        expiryMonth,
        expiryYear,
      }),
    );
    dispatch(setCurrentStep("summary"));
    onComplete();
  };

  const total = product.price * quantity + FEES.baseFee + FEES.deliveryFee;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="payment-modal"
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ValidationToast
          message={toastMessage}
          onClear={() => setToastMessage(null)}
        />

        <motion.div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        <motion.div
          className="relative bg-background rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "95svh" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
        >
          <div className="flex justify-center pt-3 flex-shrink-0">
            <div className="w-9 h-1 rounded-full bg-border" />
          </div>

          <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-3">
                <p className="sc-label">Completar compra</p>
                <h2 className="text-[17px] font-semibold tracking-tight truncate leading-tight">
                  {product.name}
                </h2>
                <p className="text-[22px] font-semibold tracking-tight mt-0.5 leading-none">
                  {fmt(total)}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <XIcon size={14} />
              </button>
            </div>

            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {(["card", "delivery"] as const).map((entryTab) => (
                <button
                  key={entryTab}
                  onClick={() => {
                    if (entryTab === "delivery" && !cardValid()) return;
                    setTab(entryTab);
                  }}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    tab === entryTab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {entryTab === "card" ? (
                    <CreditCardIcon size={12} />
                  ) : (
                    <TruckIcon size={12} />
                  )}
                  {entryTab === "card" ? "Tarjeta" : "Envío"}
                  {((entryTab === "card" && cardValid() && tab !== "card") ||
                    (entryTab === "delivery" && deliveryValid())) && (
                    <div className="w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center">
                      <CheckIcon size={8} className="text-background" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sheet-scroll">
            <AnimatePresence mode="wait">
              {tab === "card" ? (
                <CardFormSection
                  cardNumber={cardNumber}
                  holderName={holderName}
                  expiry={expiry}
                  cvc={cvc}
                  brand={brand}
                  showCvc={showCvc}
                  setShowCvc={setShowCvc}
                  onCardNumberChange={handleCardNumber}
                  onHolderNameChange={setHolderName}
                  onExpiryChange={handleExpiry}
                  onCvcChange={setCvc}
                />
              ) : (
                <DeliveryFormSection
                  values={deliveryValues}
                  onChange={setDeliveryValues}
                />
              )}
            </AnimatePresence>
          </div>

          <ModalFooter
            tab={tab}
            onContinue={handleContinue}
            onBackToCard={() => setTab("card")}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
