import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { transitions } from "@/lib/motion";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  XCircleIcon,
} from "@/components/icons";

interface StatusHeroProps {
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  isOnline: boolean;
}

function StatusGlyph({ status }: { status: StatusHeroProps["status"] }) {
  const shouldReduceMotion = useReducedMotion();
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isDeclined =
    status === "DECLINED" || status === "ERROR" || status === "VOIDED";

  const statusConfig = isApproved
    ? {
        shellClass:
          "bg-emerald-500/12 border-emerald-300/60 text-emerald-700 dark:text-emerald-300",
        Icon: CheckCircleIcon,
      }
    : isPending
      ? {
          shellClass:
            "bg-orange-500/10 border-orange-300/55 text-orange-700 dark:text-orange-300",
          Icon: AlertCircleIcon,
        }
      : {
          shellClass:
            "bg-red-500/10 border-red-300/55 text-red-700 dark:text-red-300",
          Icon: XCircleIcon,
        };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={status}
        initial={{
          opacity: 0,
          scale: shouldReduceMotion ? 1 : 0.92,
          y: shouldReduceMotion ? 0 : 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          ...(isDeclined && !shouldReduceMotion
            ? { x: [0, -3, 3, -2, 2, 0] }
            : { x: 0 }),
        }}
        exit={{
          opacity: 0,
          scale: shouldReduceMotion ? 1 : 0.96,
          y: shouldReduceMotion ? 0 : -8,
        }}
        transition={{
          ...(shouldReduceMotion
            ? { duration: 0.15, ease: [0.2, 0, 0, 1] }
            : { type: "spring", damping: 18, stiffness: 220, mass: 0.75 }),
          ...(isDeclined && !shouldReduceMotion ? { duration: 0.42 } : {}),
        }}
      >
        <div
          className={`relative w-[90px] h-[90px] rounded-[26px] border flex items-center justify-center shadow-premium ${statusConfig.shellClass}`}
        >
          {isPending && (
            <motion.div
              className="absolute inset-[8px] rounded-[20px] border border-orange-300/45"
              animate={shouldReduceMotion ? { opacity: 0.5 } : { rotate: 360 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 2.8, ease: "linear", repeat: Infinity }
              }
            />
          )}
          {isPending && (
            <LoaderIcon
              size={22}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-background border border-border text-orange-500 shadow-sm"
            />
          )}
          <statusConfig.Icon size={36} className="stroke-[2.25]" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function StatusHero({ status, isOnline }: StatusHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isDeclined =
    status === "DECLINED" || status === "ERROR" || status === "VOIDED";

  return (
    <div className="w-full flex flex-col items-center relative">
      {!isOnline && isPending && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.enterFadeUp(!!shouldReduceMotion)}
          className="mb-4 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 text-[11px] font-semibold border border-orange-500/20"
        >
          Sin conexión: seguiremos verificando automáticamente al reconectarte.
        </motion.div>
      )}

      <AnimatePresence>
        {isPending && (
          <motion.div
            className="absolute top-[2px] left-1/2 -translate-x-1/2 pointer-events-none w-[94px] h-[94px] rounded-[28px] border border-orange-400/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.enterFadeUp(!!shouldReduceMotion, 0.05)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isApproved && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-[106px] h-[106px] rounded-[30px] bg-emerald-500/20 blur-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              shouldReduceMotion
                ? { opacity: 0.5, scale: 1 }
                : { opacity: [0.38, 0.58, 0.38], scale: [0.98, 1.04, 0.98] }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.15 : 2.8,
              repeat: shouldReduceMotion ? 0 : Infinity,
              ease: [0.2, 0, 0, 1],
            }}
          />
        )}
      </AnimatePresence>
      <StatusGlyph status={status} />

      <motion.h1
        className="text-[28px] font-semibold tracking-[-0.025em] leading-tight text-foreground text-center mt-5"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.enterFadeUp(!!shouldReduceMotion, 0.04)}
      >
        {isApproved
          ? "¡Pago aprobado!"
          : isPending
            ? "Verificando pago"
            : "Pago rechazado"}
      </motion.h1>

      <motion.p
        className="text-sm mt-2 max-w-[295px] text-center text-muted-foreground leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transitions.enterFadeUp(!!shouldReduceMotion, 0.07)}
      >
        {isApproved
          ? "Tu transacción fue procesada exitosamente."
          : isPending
            ? "Estamos consultando el estado más reciente de tu pago."
            : "No pudimos procesar la transacción con la tarjeta ingresada."}
      </motion.p>
    </div>
  );
}
