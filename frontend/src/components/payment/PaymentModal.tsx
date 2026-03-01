"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCreditCard,
  setDeliveryInfo,
  setCurrentStep,
  CreditCard,
  DeliveryInfo,
  Product,
} from "@/store/payment-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  CreditCardIcon,
  TruckIcon,
  UserIcon,
  CheckIcon,
  LockIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { FEES } from "@/lib/payment-provider";
import { CreditCardPreview } from "./CreditCardPreview";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatCardNumber,
  formatExpiry,
  detectCardBrand,
  validateCardNumber,
  validateExpiryDate,
  validateCVC,
} from "@/store/payment-store";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onComplete: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  product,
  onComplete,
}: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const { creditCard: savedCard, deliveryInfo: savedDelivery } = useAppSelector(
    (state) => state.payment,
  );
  const [activeTab, setActiveTab] = useState("card");

  // Credit card state
  const [cardNumber, setCardNumber] = useState(savedCard?.number || "");
  const [holderName, setHolderName] = useState(savedCard?.holderName || "");
  const [expiry, setExpiry] = useState(
    savedCard ? `${savedCard.expiryMonth}/${savedCard.expiryYear}` : "",
  );
  const [cvc, setCvc] = useState(savedCard?.cvc || "");
  const [cardBrand, setCardBrand] = useState<"VISA" | "MASTERCARD" | "UNKNOWN">(
    savedCard?.brand || "UNKNOWN",
  );
  const [showCvc, setShowCvc] = useState(false);

  // Delivery state
  const [firstName, setFirstName] = useState(savedDelivery?.firstName || "");
  const [lastName, setLastName] = useState(savedDelivery?.lastName || "");
  const [email, setEmail] = useState(savedDelivery?.email || "");
  const [phone, setPhone] = useState(savedDelivery?.phone || "");
  const [documentType, setDocumentType] = useState(
    savedDelivery?.documentType || "CC",
  );
  const [documentNumber, setDocumentNumber] = useState(
    savedDelivery?.documentNumber || "",
  );
  const [address, setAddress] = useState(savedDelivery?.address || "");
  const [city, setCity] = useState(savedDelivery?.city || "");
  const [state, setState] = useState(savedDelivery?.state || "");
  const [postalCode, setPostalCode] = useState(savedDelivery?.postalCode || "");
  const [additionalInfo, setAdditionalInfo] = useState(
    savedDelivery?.additionalInfo || "",
  );

  // Handle card number change with formatting and brand detection
  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, "").length <= 19) {
      setCardNumber(formatted);
      setCardBrand(detectCardBrand(value));
    }
  };

  // Handle expiry change with formatting
  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    setExpiry(formatted);
  };

  // Validate card tab
  const isCardValid = (): boolean => {
    const [month, year] = expiry.split("/");
    return (
      validateCardNumber(cardNumber) &&
      holderName.trim().length >= 3 &&
      validateExpiryDate(month || "", year || "") &&
      validateCVC(cvc)
    );
  };

  // Validate delivery tab
  const isDeliveryValid = (): boolean => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      phone.trim().length >= 7 &&
      documentNumber.trim().length >= 5 &&
      address.trim().length >= 5 &&
      city.trim().length >= 2
    );
  };

  // Handle continue
  const handleContinue = () => {
    const [month, year] = expiry.split("/");

    // Save credit card info to Redux store (Flux action)
    const cardData: CreditCard = {
      number: cardNumber,
      holderName,
      expiryMonth: month || "",
      expiryYear: year || "",
      cvc,
      brand: cardBrand,
    };
    dispatch(setCreditCard(cardData));

    // Save delivery info to Redux store (Flux action)
    const deliveryData: DeliveryInfo = {
      firstName,
      lastName,
      email,
      phone,
      documentType,
      documentNumber,
      address,
      city,
      state,
      postalCode,
      additionalInfo,
    };
    dispatch(setDeliveryInfo(deliveryData));

    // Move to summary step
    dispatch(setCurrentStep("summary"));
    onComplete();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalAmount = product.price + FEES.baseFee + FEES.deliveryFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto p-0 gap-0">
        {/* Header with product summary */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
          <DialogHeader>
            <DialogTitle className="text-white">Completar Compra</DialogTitle>
            <DialogDescription className="text-slate-300">
              {product.name}
            </DialogDescription>
          </DialogHeader>

          {/* Product mini-summary */}
          <div className="flex items-center gap-3 mt-4 bg-white/10 rounded-lg p-3">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white">
              <CreditCardIcon size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{product.name}</p>
              <p className="text-xs text-slate-400">Cantidad: 1</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatPrice(totalAmount)}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCardIcon size={16} />
                <span>Tarjeta</span>
                {isCardValid() && (
                  <CheckIcon size={12} className="text-green-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <TruckIcon size={16} />
                <span>Envío</span>
                {isDeliveryValid() && (
                  <CheckIcon size={12} className="text-green-500" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Card Tab */}
            <TabsContent value="card" className="space-y-4 mt-0">
              {/* Credit Card Preview */}
              <CreditCardPreview
                number={cardNumber}
                holderName={holderName}
                expiry={expiry}
                brand={cardBrand}
                isFlipped={showCvc}
              />

              {/* Card Brand Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    cardBrand === "VISA"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => setCardBrand("VISA")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-6 w-10" viewBox="0 0 48 32">
                      <rect width="48" height="32" rx="4" fill="#1A1F71" />
                      <text
                        x="24"
                        y="20"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        VISA
                      </text>
                    </svg>
                    {cardBrand === "VISA" && (
                      <CheckIcon size={16} className="text-blue-500" />
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    cardBrand === "MASTERCARD"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => setCardBrand("MASTERCARD")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-6 w-10" viewBox="0 0 48 32">
                      <rect width="48" height="32" rx="4" fill="#000" />
                      <circle cx="19" cy="16" r="8" fill="#EB001B" />
                      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
                    </svg>
                    {cardBrand === "MASTERCARD" && (
                      <CheckIcon size={16} className="text-orange-500" />
                    )}
                  </div>
                </button>
              </div>

              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="flex items-center gap-2">
                  Número de Tarjeta
                  {cardNumber && validateCardNumber(cardNumber) && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    >
                      <CheckIcon size={12} className="mr-1" /> Válido
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    onFocus={() => setShowCvc(false)}
                    maxLength={19}
                    className="pr-10"
                  />
                  <LockIcon
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              {/* Card Holder */}
              <div className="space-y-2">
                <Label htmlFor="holderName">Nombre del Titular</Label>
                <Input
                  id="holderName"
                  placeholder="JUAN PEREZ"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                  onFocus={() => setShowCvc(false)}
                />
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Vencimiento</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    onFocus={() => setShowCvc(false)}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) =>
                      setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    onFocus={() => setShowCvc(true)}
                    onBlur={() => setShowCvc(false)}
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>

              {/* Test card info */}
              <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">
                  💳 Tarjetas de prueba (Sandbox):
                </p>
                <p>• VISA: 4242 4242 4242 4242</p>
                <p>• MasterCard: 5555 5555 5555 4444</p>
                <p>• CVC: 123, Fecha: cualquier fecha futura</p>
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-4 mt-0">
              {/* Personal Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon size={16} />
                <span>Datos personales</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">C.C.</SelectItem>
                      <SelectItem value="CE">C.E.</SelectItem>
                      <SelectItem value="NIT">NIT</SelectItem>
                      <SelectItem value="PP">Pasap.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="documentNumber">Número</Label>
                  <Input
                    id="documentNumber"
                    placeholder="12345678"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TruckIcon size={16} />
                <span>Dirección de envío</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle 123 # 45-67, Apto 501"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Bogotá"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    placeholder="Cundinamarca"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="postalCode">Código Postal (opcional)</Label>
                <Input
                  id="postalCode"
                  placeholder="11001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="additionalInfo">
                  Info adicional (opcional)
                </Label>
                <Input
                  id="additionalInfo"
                  placeholder="Referencias, instrucciones..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <ShieldCheckIcon size={16} />
            <span>Tus datos están protegidos con encriptación SSL</span>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "card" ? (
              <motion.div
                key="card-btn"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setActiveTab("delivery")}
                  disabled={!isCardValid()}
                >
                  Continuar a Envío
                  <ArrowRightIcon size={16} className="ml-2" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="complete-btn"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinue}
                  disabled={!isDeliveryValid()}
                >
                  Ver Resumen
                  <ArrowRightIcon size={16} className="ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
