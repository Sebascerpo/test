import { motion, AnimatePresence } from "framer-motion";

interface StatusHeroProps {
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  isOnline: boolean;
}

function StatusGlyph({ status }: { status: StatusHeroProps["status"] }) {
  if (status === "PENDING") {
    return (
      <div className="w-[80px] h-[80px] rounded-[24px] bg-muted border border-border flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="w-[80px] h-[80px] rounded-[24px] bg-emerald-500 flex items-center justify-center text-white text-3xl font-semibold">
        ✓
      </div>
    );
  }

  return (
    <div className="w-[80px] h-[80px] rounded-[24px] bg-red-50 border border-red-200 flex items-center justify-center text-red-500 text-3xl font-semibold">
      ×
    </div>
  );
}

export function StatusHero({ status, isOnline }: StatusHeroProps) {
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isDeclined =
    status === "DECLINED" || status === "ERROR" || status === "VOIDED";

  return (
    <div className="w-full flex flex-col items-center relative">
      {!isOnline && isPending && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 text-[11px] font-semibold border border-orange-500/20"
        >
          Sin conexión: seguiremos verificando automáticamente al reconectarte.
        </motion.div>
      )}

      {/* Radar rings for pending */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((idx) => (
              <motion.div
                key={idx}
                className="absolute rounded-full border border-foreground/15"
                initial={{
                  width: 80,
                  height: 80,
                  x: -40,
                  y: -40,
                  opacity: 0.5,
                }}
                animate={{
                  width: 200,
                  height: 200,
                  x: -100,
                  y: -100,
                  opacity: 0,
                }}
                transition={{
                  duration: 2,
                  delay: idx * 0.45,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success glow */}
      <AnimatePresence>
        {isApproved && (
          <motion.div
            className="absolute top-9 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.9, 0.4], scale: [0.9, 1.12, 0.96] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={
          isDeclined
            ? {
                scale: 1,
                opacity: 1,
                x: [0, -3, 3, -2, 2, 0],
              }
            : { scale: 1, opacity: 1, x: 0 }
        }
        transition={{
          type: "spring",
          damping: 16,
          stiffness: 220,
          ...(isDeclined ? { duration: 0.45 } : {}),
        }}
      >
        <StatusGlyph status={status} />
      </motion.div>

      <motion.h1
        className="text-[27px] font-semibold tracking-tight leading-tight text-foreground text-center mt-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isApproved
          ? "¡Pago aprobado!"
          : isPending
            ? "Verificando pago"
            : "Pago rechazado"}
      </motion.h1>

      <motion.p
        className="text-sm mt-2 max-w-[280px] text-center text-muted-foreground leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
