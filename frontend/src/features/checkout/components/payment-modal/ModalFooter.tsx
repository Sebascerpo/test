import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { transitions } from "@/lib/motion";

interface ModalFooterProps {
  tab: "card" | "delivery";
  onContinue: () => void;
  onBackToCard: () => void;
  shouldReduceMotion: boolean;
}

export function ModalFooter({
  tab,
  onContinue,
  onBackToCard,
  shouldReduceMotion,
}: ModalFooterProps) {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-background surface-1">
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
            transition={transitions.enterFadeUp(shouldReduceMotion)}
          >
            <button onClick={onContinue} className="sc-btn-primary">
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
            transition={transitions.enterFadeUp(shouldReduceMotion)}
            className="flex gap-2"
          >
            <button
              onClick={onBackToCard}
              className="h-[52px] w-[52px] flex-shrink-0 rounded-xl border border-border bg-muted hover:bg-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150 [transition-timing-function:var(--ease-smooth)] active:scale-[0.94]"
            >
              <ArrowLeftIcon size={16} />
            </button>
            <button
              onClick={onContinue}
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
  );
}
