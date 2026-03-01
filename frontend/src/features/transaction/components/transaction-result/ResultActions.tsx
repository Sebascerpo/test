import { motion, useReducedMotion } from "framer-motion";
import { transitions } from "@/lib/motion";

interface ResultActionsProps {
  isPending: boolean;
  countdown: number;
  autoRedirectEnabled: boolean;
  onToggleAutoRedirect: () => void;
  onGoToCatalog: () => void;
}

export function ResultActions({
  isPending,
  countdown,
  autoRedirectEnabled,
  onToggleAutoRedirect,
  onGoToCatalog,
}: ResultActionsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full max-w-sm mt-5 mx-auto">
      {!isPending && (
        <div className="text-center mb-2">
          <p className="text-xs text-muted-foreground">
            {autoRedirectEnabled
              ? `Volviendo al catálogo en ${countdown}s...`
              : "Redirección automática pausada"}
          </p>
        </div>
      )}

      <motion.button
        onClick={onGoToCatalog}
        className="w-full h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-150 [transition-timing-function:var(--ease-smooth)] active:scale-[0.985] bg-foreground text-background hover:opacity-90 shadow-premium"
        whileTap={shouldReduceMotion ? undefined : transitions.buttonPress}
      >
        {isPending ? "Cerrar y seguir verificando" : "Volver al catálogo"}
      </motion.button>

      {!isPending && (
        <motion.button
          onClick={onToggleAutoRedirect}
          className="w-full mt-2 h-10 rounded-[14px] text-sm font-medium flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150 [transition-timing-function:var(--ease-smooth)]"
          whileTap={shouldReduceMotion ? undefined : transitions.buttonPress}
        >
          {autoRedirectEnabled ? "Quedarme aquí" : "Reactivar redirección"}
        </motion.button>
      )}
    </div>
  );
}
