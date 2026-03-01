"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircleIcon } from "@/components/icons";

interface ValidationToastProps {
  message: string | null;
  onClear: () => void;
}

export function ValidationToast({ message, onClear }: ValidationToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="validation-toast"
          initial={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 10, scale: 0.98, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
        >
          <div className="toast-content relative overflow-hidden">
            {/* Progress bar for auto-hide */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-destructive/30"
              initial={{ width: "100%" }}
              animate={{ width: 0 }}
              transition={{ duration: 4, ease: "linear" }}
            />

            <div className="toast-icon">
              <AlertCircleIcon size={12} className="text-white fill-current" />
            </div>
            <span className="toast-text">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
