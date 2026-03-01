"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { reset, syncTransactionStatus } from "@/store/payment-store";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const APP_CURRENCY = import.meta.env.VITE_CURRENCY || "COP";

interface TransactionResultPageProps {
  onDismiss: (showToast: boolean) => void;
}

const fmt = (p: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: APP_CURRENCY,
    minimumFractionDigits: 0,
  }).format(p);

// ── Heartbeat SVG line ────────────────────────────────────────────────────────
function HeartbeatLine({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      className="w-full max-w-[220px]"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.polyline
        points="0,30 30,30 38,10 46,50 54,18 62,42 70,30 200,30"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </svg>
  );
}

// ── Pending: pulsing radar rings ──────────────────────────────────────────────
function RadarRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-foreground/10"
          style={{ width: 80, height: 80 }}
          animate={{
            width: [80, 80 + (i + 1) * 120],
            height: [80, 80 + (i + 1) * 120],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2.4,
            delay: i * 0.55,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Approved: green heartbeat that floods the screen ─────────────────────────
function ApprovedFlood({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full bg-emerald-500 pointer-events-none z-0"
      style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
      initial={{ width: 80, height: 80, borderRadius: "50%" }}
      animate={{ width: "300vmax", height: "300vmax", borderRadius: "50%" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      onAnimationComplete={onComplete}
    />
  );
}

// ── Declined: shake + red flash ───────────────────────────────────────────────
function DeclinedFlash() {
  return (
    <motion.div
      className="absolute inset-0 bg-red-500/8 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0, 1, 0] }}
      transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
    />
  );
}

// ── Dynamic status icon ───────────────────────────────────────────────────────
function StatusIcon({ status, flooded }: { status: string; flooded: boolean }) {
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isError =
    status === "DECLINED" || status === "ERROR" || status === "VOIDED";

  return (
    <motion.div
      key={status}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 14, stiffness: 200 }}
      className="relative"
    >
      {/* Outer glow ring */}
      {isPending && (
        <motion.div
          className="absolute inset-[-12px] rounded-full border-2 border-foreground/15"
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {isApproved && !flooded && (
        <>
          <motion.div
            className="absolute inset-[-10px] rounded-full border-2 border-emerald-400/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-[-22px] rounded-full border border-emerald-400/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{
              duration: 1.2,
              delay: 0.3,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </>
      )}

      {/* Icon face */}
      <div
        className={`
          w-[80px] h-[80px] rounded-[26px] flex items-center justify-center relative z-10
          ${isPending ? "bg-muted border border-border" : ""}
          ${isApproved && !flooded ? "bg-emerald-500" : ""}
          ${isApproved && flooded ? "bg-white" : ""}
          ${isError ? "bg-red-50 border border-red-200" : ""}
        `}
      >
        {isPending && <PendingSpinner />}
        {isApproved && <ApprovedCheck flooded={flooded} />}
        {isError && <ErrorX />}
      </div>
    </motion.div>
  );
}

function PendingSpinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      {/* Static track */}
      <circle
        cx="18"
        cy="18"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-border"
      />
      {/* Animated arc */}
      <motion.circle
        cx="18"
        cy="18"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-foreground"
        strokeDasharray="22 66"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "18px 18px" }}
      />
      {/* Center dot pulse */}
      <motion.circle
        cx="18"
        cy="18"
        r="3"
        fill="currentColor"
        className="text-foreground/60"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{ transformOrigin: "18px 18px" }}
      />
    </svg>
  );
}

function ApprovedCheck({ flooded }: { flooded: boolean }) {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <motion.polyline
        points="8,20 15,27 30,11"
        stroke={flooded ? "#10b981" : "white"}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      />
    </svg>
  );
}

function ErrorX() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <motion.line
        x1="11"
        y1="11"
        x2="25"
        y2="25"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="25"
        y1="11"
        x2="11"
        y2="25"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TransactionResultPage({
  onDismiss,
}: TransactionResultPageProps) {
  const dispatch = useAppDispatch();
  const { isOnline: localOnline } = useNetworkStatus();

  const {
    transactionResult,
    selectedProduct,
    creditCard,
    deliveryInfo,
    quantity,
  } = useAppSelector((s) => s.payment);

  const [flooded, setFlooded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const latestStatus = useRef(transactionResult?.status);

  const isPending = transactionResult?.status === "PENDING";
  const isApproved = transactionResult?.status === "APPROVED";
  const isDeclined =
    transactionResult?.status === "DECLINED" ||
    transactionResult?.status === "ERROR" ||
    transactionResult?.status === "VOIDED";

  // ── Real-time sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isApproved) setShowContent(true);
  }, [isApproved]);

  const handleDismiss = useCallback(() => {
    onDismiss(true);
    dispatch(reset());
  }, [dispatch, onDismiss]);

  if (!transactionResult) return null;

  // ── Background color ────────────────────────────────────────────────────────
  const pageBg = flooded
    ? "bg-emerald-500"
    : isDeclined
      ? "bg-background"
      : "bg-background";

  // ── Text colors for flooded state ───────────────────────────────────────────
  const textPrimary = flooded ? "text-white" : "text-foreground";
  const textSecondary = flooded ? "text-white/70" : "text-muted-foreground";
  const cardBg = flooded
    ? "bg-white/15 border-white/20"
    : "bg-background border-border";
  const detailText = flooded ? "text-white/80" : "text-foreground/70";
  const labelText = flooded ? "text-white/50" : "text-muted-foreground";
  const ctaBg = flooded
    ? "bg-white text-emerald-600 hover:bg-white/90"
    : isDeclined
      ? "bg-foreground text-background hover:opacity-90"
      : "bg-foreground text-background hover:opacity-90";

  return (
    <motion.div
      className={`fixed inset-0 z-[60] flex flex-col overflow-hidden transition-colors duration-700 ${pageBg}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <AnimatePresence>
        {!localOnline && isPending && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-semibold border border-orange-500/20 backdrop-blur-md flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Sin conexión — Reintentando...
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Background layers ──────────────────────────────────────────── */}
      {isPending && <RadarRings />}
      {isDeclined && <DeclinedFlash />}

      {/* Green flood expands from center on approved */}
      <AnimatePresence>
        {isApproved && !flooded && (
          <ApprovedFlood
            onComplete={() => {
              setFlooded(true);
              setShowContent(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="relative z-10 flex-1 overflow-y-auto sheet-scroll flex flex-col items-center px-5 pt-14 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* Status icon */}
            <div className="mb-5 relative">
              <StatusIcon status={transactionResult.status} flooded={flooded} />
            </div>

            {/* Heartbeat line — shown briefly then fades */}
            <AnimatePresence>
              {(isApproved || isPending) && !flooded && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <HeartbeatLine
                    color={isApproved ? "#10b981" : "currentColor"}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.h1
                  key={transactionResult.status + String(flooded)}
                  className={`text-[27px] font-semibold tracking-tight leading-tight ${textPrimary}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {isApproved
                    ? "¡Pago aprobado!"
                    : isPending
                      ? "Verificando pago"
                      : "Pago rechazado"}
                </motion.h1>
              </AnimatePresence>

              <motion.p
                className={`text-sm mt-1.5 max-w-[260px] mx-auto leading-relaxed ${textSecondary}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isApproved
                  ? "Tu transacción fue procesada exitosamente."
                  : isPending
                    ? "Estamos confirmando tu transacción en tiempo real."
                    : "No pudimos procesar tu tarjeta."}
              </motion.p>
            </motion.div>

            {/* Status pill + sync indicator */}
            <motion.div
              className="flex items-center gap-2 mb-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                  isApproved && flooded
                    ? "bg-white/20 text-white"
                    : isApproved
                      ? "bg-emerald-100 text-emerald-700"
                      : isPending
                        ? "bg-muted text-muted-foreground"
                        : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {isApproved
                  ? "Aprobado"
                  : isPending
                    ? "Verificando…"
                    : "Rechazado"}
              </span>

              {isPending && (
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${textSecondary}`}
                >
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full ${flooded ? "bg-white/60" : "bg-muted-foreground"}`}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  Verificando…
                </div>
              )}
            </motion.div>

            {/* Detail card */}
            <motion.div
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                damping: 24,
                stiffness: 200,
              }}
            >
              <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                {/* Product row */}
                {selectedProduct && (
                  <div
                    className={`flex items-center gap-3 px-4 py-3.5 border-b ${flooded ? "border-white/15" : "border-border"}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${flooded ? "bg-white/15" : "bg-muted"}`}
                    >
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${textPrimary}`}
                      >
                        {selectedProduct.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${textSecondary}`}>
                        Cantidad: {quantity}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-semibold flex-shrink-0 ${textPrimary}`}
                    >
                      {fmt(transactionResult.amount)}
                    </p>
                  </div>
                )}

                {/* Transaction details */}
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    {
                      label: "Referencia",
                      value: transactionResult.transactionNumber,
                      mono: true,
                    },
                    transactionResult.externalTransactionId
                      ? {
                          label: "ID externo",
                          value: transactionResult.externalTransactionId,
                          mono: true,
                        }
                      : null,
                    creditCard
                      ? {
                          label: "Tarjeta",
                          value: `${creditCard.brand} •••• ${creditCard.number.slice(-4)}`,
                          mono: false,
                        }
                      : null,
                    deliveryInfo
                      ? {
                          label: "Ciudad de envío",
                          value: deliveryInfo.city,
                          mono: false,
                        }
                      : null,
                  ]
                    .filter(Boolean)
                    .map((row) => (
                      <div
                        key={row!.label}
                        className="flex items-center justify-between"
                      >
                        <span className={`text-xs ${labelText}`}>
                          {row!.label}
                        </span>
                        <span
                          className={`text-xs max-w-[160px] truncate text-right ${row!.mono ? `font-mono ${detailText}` : detailText}`}
                        >
                          {row!.value}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Contextual info banner */}
                <div
                  className={`mx-4 mb-4 rounded-xl p-3 ${flooded ? "bg-white/15" : isDeclined ? "bg-red-50 border border-red-200" : "bg-muted border border-border"}`}
                >
                  <p
                    className={`text-[11px] leading-relaxed ${flooded ? "text-white/80" : isDeclined ? "text-red-600" : "text-muted-foreground"}`}
                  >
                    {isApproved
                      ? `Confirmación enviada a ${deliveryInfo?.email ?? "tu correo"}. Entrega estimada en 24–48 horas.`
                      : isPending
                        ? "Actualizamos el estado cada 4 segundos. Puedes esperar o cerrar — recibirás una notificación."
                        : (transactionResult.errorMessage ??
                          "Verifica los datos de tu tarjeta e intenta de nuevo.")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA button */}
            <motion.div
              className="w-full max-w-sm mt-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleDismiss}
                className={`w-full h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${ctaBg}`}
              >
                {isApproved
                  ? "Seguir comprando"
                  : isPending
                    ? "Entendido, seguir esperando"
                    : "Intentar de nuevo"}
              </button>

              {isPending && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleDismiss}
                  className={`w-full mt-2 h-10 rounded-[14px] text-sm font-medium flex items-center justify-center transition-all ${
                    flooded
                      ? "text-white/60 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cerrar y recibir notificación
                </motion.button>
              )}
            </motion.div>

            {/* Trust line */}
            <motion.p
              className={`flex items-center gap-1.5 text-[11px] mt-6 ${textSecondary}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Transacción procesada de forma segura
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shown while flood animation is running (before content appears) */}
      {isApproved && !showContent && (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <StatusIcon status="APPROVED" flooded={false} />
        </div>
      )}
    </motion.div>
  );
}
