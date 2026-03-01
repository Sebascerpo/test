"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCreditCard,
  setDeliveryInfo,
  setCurrentStep,
  Product,
  formatCardNumber,
  detectCardBrand,
  validateCardNumber,
  validateExpiryDate,
  validateCVC,
} from "@/store/payment-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  TruckIcon,
  UserIcon,
  CheckIcon,
  LockIcon,
  ShieldCheckIcon,
  XIcon,
  AlertCircleIcon,
} from "@/components/icons";
import { ValidationToast } from "@/components/ui/ValidationToast";
import { FEES } from "@/lib/payment-provider";
import { CreditCardPreview } from "./CreditCardPreview";
import { motion, AnimatePresence } from "framer-motion";

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

function SectionHead({
  icon: Icon,
  label,
}: {
  icon: React.FC<any>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon size={12} className="text-muted-foreground" />
      <span className="sc-label !mb-0">{label}</span>
    </div>
  );
}

function Field({
  label,
  children,
  valid,
}: {
  label: string;
  children: React.ReactNode;
  valid?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="sc-label">{label}</label>
        <AnimatePresence>
          {valid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center"
            >
              <CheckIcon size={9} className="text-background" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}

export function PaymentModal({
  open,
  onOpenChange,
  product,
  onComplete,
}: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const {
    creditCard: saved,
    deliveryInfo: savedDelivery,
    quantity,
  } = useAppSelector((s) => s.payment);
  const [tab, setTab] = useState<"card" | "delivery">("card");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Card state ──────────────────────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState(saved?.number || "");
  const [holderName, setHolderName] = useState(saved?.holderName || "");
  const [expiry, setExpiry] = useState(
    saved ? `${saved.expiryMonth}/${saved.expiryYear}` : "",
  );
  const [cvc, setCvc] = useState(saved?.cvc || "");
  const [brand, setBrand] = useState<"VISA" | "MASTERCARD" | "UNKNOWN">(
    saved?.brand || "UNKNOWN",
  );
  const [showCvc, setShowCvc] = useState(false);

  // ── Delivery state ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(savedDelivery?.firstName || "");
  const [lastName, setLastName] = useState(savedDelivery?.lastName || "");
  const [email, setEmail] = useState(savedDelivery?.email || "");
  const [phone, setPhone] = useState(savedDelivery?.phone || "");
  const [docType, setDocType] = useState(savedDelivery?.documentType || "CC");
  const [docNumber, setDocNumber] = useState(
    savedDelivery?.documentNumber || "",
  );
  const [address, setAddress] = useState(savedDelivery?.address || "");
  const [city, setCity] = useState(savedDelivery?.city || "");
  const [state, setState] = useState(savedDelivery?.state || "");
  const [postalCode, setPostalCode] = useState(savedDelivery?.postalCode || "");
  const [additionalInfo, setAdditionalInfo] = useState(
    savedDelivery?.additionalInfo || "",
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCardNumber = (val: string) => {
    const f = formatCardNumber(val);
    if (f.replace(/\s/g, "").length <= 19) {
      setCardNumber(f);
      setBrand(detectCardBrand(val));
    }
  };

  const handleExpiry = (val: string) => {
    const d = val.replace(/\D/g, "");
    setExpiry(d.length >= 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d);
  };

  const cardValid = () => {
    const [m, y] = expiry.split("/");
    return (
      validateCardNumber(cardNumber) &&
      holderName.trim().length >= 5 &&
      validateExpiryDate(m || "", y || "") &&
      validateCVC(cvc)
    );
  };

  const deliveryValid = () =>
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.trim().length >= 7 &&
    docNumber.trim().length >= 5 &&
    address.trim().length >= 5 &&
    city.trim().length >= 2;

  const handleContinue = () => {
    if (tab === "card") {
      if (!validateCardNumber(cardNumber))
        return showToast("El número de tarjeta es inválido");
      if (holderName.trim().length < 5)
        return showToast("Ingresa el nombre completo del titular");
      const [m, y] = expiry.split("/");
      if (!validateExpiryDate(m || "", y || ""))
        return showToast("La fecha de expiración es inválida");
      if (!validateCVC(cvc))
        return showToast("El CVC es inválido (3-4 dígitos)");
      setTab("delivery");
      return;
    }

    if (tab === "delivery") {
      if (firstName.trim().length < 2)
        return showToast("El nombre es muy corto");
      if (lastName.trim().length < 2)
        return showToast("El apellido es muy corto");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return showToast("El correo electrónico es inválido");
      if (phone.trim().length < 7)
        return showToast("El teléfono debe tener al menos 7 dígitos");
      if (docNumber.trim().length < 5)
        return showToast("El número de documento es inválido");
      if (address.trim().length < 5)
        return showToast("La dirección es muy corta");
      if (city.trim().length < 2) return showToast("Ingresa una ciudad válida");

      // Save to redux and proceed
      const [m, y] = expiry.split("/");
      dispatch(
        setCreditCard({
          number: cardNumber,
          holderName,
          expiryMonth: m || "",
          expiryYear: y || "",
          cvc,
          brand,
        }),
      );
      dispatch(
        setDeliveryInfo({
          firstName,
          lastName,
          email,
          phone,
          documentType: docType,
          documentNumber: docNumber,
          address,
          city,
          state,
          postalCode,
          additionalInfo,
        }),
      );
      dispatch(setCurrentStep("summary"));
      onComplete();
    }
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
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Sheet */}
        <motion.div
          className="relative bg-background rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "95svh" }}
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

            {/* Tab switcher */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {(["card", "delivery"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t === "delivery" && !cardValid()) return;
                    setTab(t);
                  }}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    tab === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "card" ? (
                    <CreditCardIcon size={12} />
                  ) : (
                    <TruckIcon size={12} />
                  )}
                  {t === "card" ? "Tarjeta" : "Envío"}
                  {((t === "card" && cardValid() && tab !== "card") ||
                    (t === "delivery" && deliveryValid())) && (
                    <div className="w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center">
                      <CheckIcon size={8} className="text-background" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto sheet-scroll">
            <AnimatePresence mode="wait">
              {/* ── CARD TAB ─────────────────────────────────────────── */}
              {tab === "card" && (
                <motion.div
                  key="card-pane"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="px-5 py-4 space-y-4"
                >
                  <CreditCardPreview
                    number={cardNumber}
                    holderName={holderName}
                    expiry={expiry}
                    brand={brand}
                    isFlipped={showCvc}
                  />

                  {/* Card number — cc-number disables password managers offering card autofill */}
                  <Field
                    label="Número de tarjeta"
                    valid={
                      cardNumber.length > 0 && validateCardNumber(cardNumber)
                    }
                  >
                    <div className="relative">
                      <input
                        className="sc-field mono pr-10"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => handleCardNumber(e.target.value)}
                        onFocus={() => setShowCvc(false)}
                        maxLength={19}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        name="cc-number"
                      />
                      <LockIcon
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </Field>

                  <Field label="Nombre del titular">
                    <input
                      className="sc-field uppercase"
                      placeholder="NOMBRE APELLIDO"
                      value={holderName}
                      onChange={(e) =>
                        setHolderName(e.target.value.toUpperCase())
                      }
                      onFocus={() => setShowCvc(false)}
                      autoComplete="cc-name"
                      name="cc-name"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vencimiento">
                      <input
                        className="sc-field mono"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => handleExpiry(e.target.value)}
                        onFocus={() => setShowCvc(false)}
                        maxLength={5}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        name="cc-exp"
                      />
                    </Field>
                    <Field label="CVC / CVV">
                      <input
                        className="sc-field mono"
                        placeholder="•••"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        onFocus={() => setShowCvc(true)}
                        onBlur={() => setShowCvc(false)}
                        maxLength={4}
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        name="cc-csc"
                      />
                    </Field>
                  </div>

                  {/* Sandbox hint */}
                  <div className="rounded-xl bg-muted border border-border p-3.5">
                    <p className="text-xs font-semibold text-foreground/60 mb-2">
                      Tarjetas de prueba
                    </p>
                    <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                      <p>VISA &nbsp;&nbsp;&nbsp; 4242 4242 4242 4242</p>
                      <p>MC &nbsp;&nbsp;&nbsp;&nbsp; 5555 5555 5555 4444</p>
                      <p>CVC &nbsp;&nbsp;&nbsp; 123 · Fecha futura</p>
                    </div>
                  </div>
                  <div className="h-2" />
                </motion.div>
              )}

              {/* ── DELIVERY TAB ─────────────────────────────────────── */}
              {tab === "delivery" && (
                <motion.div
                  key="delivery-pane"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="px-5 py-4 space-y-3.5"
                >
                  {/*
                   * Wrapping fields in a <form> with autoComplete="on" is the
                   * strongest signal to browsers to enable autofill. We use
                   * onSubmit={e => e.preventDefault()} so Enter doesn't reload.
                   */}
                  <form
                    autoComplete="on"
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-3.5"
                  >
                    <SectionHead icon={UserIcon} label="Datos personales" />

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre">
                        <input
                          className="sc-field"
                          placeholder="Juan"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          autoComplete="given-name"
                          name="given-name"
                          id="given-name"
                        />
                      </Field>
                      <Field label="Apellido">
                        <input
                          className="sc-field"
                          placeholder="Pérez"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          name="family-name"
                          id="family-name"
                        />
                      </Field>
                    </div>

                    <Field label="Correo electrónico">
                      <input
                        className="sc-field"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        name="email"
                        id="email"
                        inputMode="email"
                      />
                    </Field>

                    <Field label="Teléfono">
                      <input
                        className="sc-field"
                        type="tel"
                        placeholder="+57 300 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        name="tel"
                        id="tel"
                        inputMode="tel"
                      />
                    </Field>

                    {/* Document — no standard autocomplete token, use off */}
                    <div className="grid grid-cols-[96px_1fr] gap-3">
                      <Field label="Tipo doc.">
                        <Select value={docType} onValueChange={setDocType}>
                          <SelectTrigger className="h-[44px] bg-[var(--field-bg)] border-[var(--field-border)] rounded-[10px] text-sm text-foreground focus:ring-0 focus:border-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CC">C.C.</SelectItem>
                            <SelectItem value="CE">C.E.</SelectItem>
                            <SelectItem value="NIT">NIT</SelectItem>
                            <SelectItem value="PP">Pasap.</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Número de documento">
                        <input
                          className="sc-field mono"
                          placeholder="12345678"
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          autoComplete="off"
                          name="document-number"
                          inputMode="numeric"
                        />
                      </Field>
                    </div>

                    <div className="border-t border-border pt-3.5">
                      <SectionHead
                        icon={TruckIcon}
                        label="Dirección de envío"
                      />
                    </div>

                    <Field label="Dirección">
                      <input
                        className="sc-field"
                        placeholder="Calle 123 # 45-67, Apto 501"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        autoComplete="street-address"
                        name="street-address"
                        id="street-address"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Ciudad">
                        <input
                          className="sc-field"
                          placeholder="Bogotá"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          autoComplete="address-level2"
                          name="address-level2"
                          id="address-level2"
                        />
                      </Field>
                      <Field label="Departamento">
                        <input
                          className="sc-field"
                          placeholder="Cundinamarca"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          autoComplete="address-level1"
                          name="address-level1"
                          id="address-level1"
                        />
                      </Field>
                    </div>

                    <Field label="Código postal (opcional)">
                      <input
                        className="sc-field mono"
                        placeholder="110111"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        autoComplete="postal-code"
                        name="postal-code"
                        id="postal-code"
                        inputMode="numeric"
                      />
                    </Field>

                    <Field label="Indicaciones adicionales (opcional)">
                      <input
                        className="sc-field"
                        placeholder="Portón azul, piso 3…"
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        autoComplete="off"
                        name="address-note"
                      />
                    </Field>
                  </form>
                  <div className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-background">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <ShieldCheckIcon size={11} className="text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">
                Cifrado SSL · Datos protegidos
              </p>
            </div>

            <AnimatePresence mode="wait">
              {tab === "card" ? (
                <motion.div
                  key="btn-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button onClick={handleContinue} className="sc-btn-primary">
                    Continuar con datos de envío
                    <ArrowRightIcon size={15} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="btn-delivery"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={() => setTab("card")}
                    className="h-[52px] w-[52px] flex-shrink-0 rounded-xl border border-border bg-muted hover:bg-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  >
                    <ArrowLeftIcon size={16} />
                  </button>
                  <button
                    onClick={handleContinue}
                    className="sc-btn-primary flex-1"
                    style={{ width: "auto" }}
                  >
                    Ver resumen del pedido
                    <ArrowRightIcon size={15} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
