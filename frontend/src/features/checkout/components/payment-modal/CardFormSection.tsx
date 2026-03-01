import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { CheckIcon, LockIcon } from "@/components/icons";
import { CardBrand, validateCardNumber } from "@/store/payment-store";
import { CreditCardPreview } from "@/features/checkout/components/CreditCardPreview";

interface FieldProps {
  label: string;
  children: ReactNode;
  valid?: boolean;
}

function Field({ label, children, valid }: FieldProps) {
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

interface CardFormSectionProps {
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvc: string;
  brand: CardBrand;
  showCvc: boolean;
  setShowCvc: (show: boolean) => void;
  onCardNumberChange: (value: string) => void;
  onHolderNameChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvcChange: (value: string) => void;
}

export function CardFormSection({
  cardNumber,
  holderName,
  expiry,
  cvc,
  brand,
  showCvc,
  setShowCvc,
  onCardNumberChange,
  onHolderNameChange,
  onExpiryChange,
  onCvcChange,
}: CardFormSectionProps) {
  return (
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

      <Field
        label="Número de tarjeta"
        valid={cardNumber.length > 0 && validateCardNumber(cardNumber)}
      >
        <div className="relative">
          <input
            className="sc-field mono pr-10"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => onCardNumberChange(e.target.value)}
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
          onChange={(e) => onHolderNameChange(e.target.value.toUpperCase())}
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
            onChange={(e) => onExpiryChange(e.target.value)}
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
              onCvcChange(e.target.value.replace(/\D/g, "").slice(0, 4))
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

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Guardamos solo una vista segura de la tarjeta (marca y últimos 4
          dígitos). Por seguridad, número completo y CVC nunca se guardan en tu
          navegador.
        </p>
      </div>

      <div className="h-2" />
    </motion.div>
  );
}
