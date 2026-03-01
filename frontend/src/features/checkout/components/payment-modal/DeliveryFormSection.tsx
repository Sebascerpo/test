import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType, ReactNode } from "react";
import { CheckIcon, TruckIcon, UserIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function SectionHead({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon size={12} className="text-muted-foreground" />
      <span className="sc-label !mb-0">{label}</span>
    </div>
  );
}

export interface DeliveryFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  additionalInfo: string;
}

interface DeliveryFormSectionProps {
  values: DeliveryFormValues;
  onChange: (values: DeliveryFormValues) => void;
}

export function DeliveryFormSection({
  values,
  onChange,
}: DeliveryFormSectionProps) {
  const setValue = <K extends keyof DeliveryFormValues>(
    key: K,
    value: DeliveryFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <motion.div
      key="delivery-pane"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      className="px-5 py-4 space-y-3.5"
    >
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
              value={values.firstName}
              onChange={(e) => setValue("firstName", e.target.value)}
              autoComplete="given-name"
              name="given-name"
              id="given-name"
            />
          </Field>
          <Field label="Apellido">
            <input
              className="sc-field"
              placeholder="Pérez"
              value={values.lastName}
              onChange={(e) => setValue("lastName", e.target.value)}
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
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
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
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
            autoComplete="tel"
            name="tel"
            id="tel"
            inputMode="tel"
          />
        </Field>

        <div className="grid grid-cols-[96px_1fr] gap-3">
          <Field label="Tipo doc.">
            <Select
              value={values.docType}
              onValueChange={(value) => setValue("docType", value)}
            >
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
              value={values.docNumber}
              onChange={(e) => setValue("docNumber", e.target.value)}
              autoComplete="off"
              name="document-number"
              inputMode="numeric"
            />
          </Field>
        </div>

        <div className="border-t border-border pt-3.5">
          <SectionHead icon={TruckIcon} label="Dirección de envío" />
        </div>

        <Field label="Dirección">
          <input
            className="sc-field"
            placeholder="Calle 123 # 45-67, Apto 501"
            value={values.address}
            onChange={(e) => setValue("address", e.target.value)}
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
              value={values.city}
              onChange={(e) => setValue("city", e.target.value)}
              autoComplete="address-level2"
              name="address-level2"
              id="address-level2"
            />
          </Field>
          <Field label="Departamento">
            <input
              className="sc-field"
              placeholder="Cundinamarca"
              value={values.state}
              onChange={(e) => setValue("state", e.target.value)}
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
            value={values.postalCode}
            onChange={(e) => setValue("postalCode", e.target.value)}
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
            value={values.additionalInfo}
            onChange={(e) => setValue("additionalInfo", e.target.value)}
            autoComplete="off"
            name="address-note"
          />
        </Field>
      </form>
      <div className="h-2" />
    </motion.div>
  );
}
