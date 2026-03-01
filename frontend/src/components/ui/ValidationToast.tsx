"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircleIcon } from "@/components/icons";
import { transitions } from "@/lib/motion";

export type ToastTone = "pending" | "approved" | "declined" | "neutral";

interface ValidationToastProps {
  message: string | null;
  onClear: () => void;
  tone?: ToastTone;
}

export function ValidationToast({
  message,
  onClear,
  tone = "declined",
}: ValidationToastProps) {
  const shouldReduceMotion = useReducedMotion();
  const toneClass =
    tone === "approved"
      ? "toast--approved"
      : tone === "pending"
        ? "toast--pending"
        : tone === "neutral"
          ? "toast--neutral"
          : "toast--declined";

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="validation-toast"
          initial={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : 20,
            scale: shouldReduceMotion ? 1 : 0.95,
            x: "-50%",
          }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : 10,
            scale: shouldReduceMotion ? 1 : 0.98,
            x: "-50%",
          }}
          transition={transitions.enterFadeUp(!!shouldReduceMotion)}
        >
          <div className={`toast-content toast-tone ${toneClass} relative overflow-hidden`}>
            {/* Progress bar for auto-hide */}
            <motion.div
              className="toast-progress absolute bottom-0 left-0 h-0.5"
              initial={{ width: "100%" }}
              animate={{ width: 0 }}
              transition={{ duration: 4, ease: "linear" }}
            />

            <div className="toast-icon">
              <AlertCircleIcon size={12} className="fill-current" />
            </div>
            <span className="toast-text">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
