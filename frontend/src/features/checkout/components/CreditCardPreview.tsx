"use client";

import { motion, useReducedMotion } from "framer-motion";
import { transitions } from "@/lib/motion";

interface CreditCardPreviewProps {
  number: string;
  holderName: string;
  expiry: string;
  brand: "VISA" | "MASTERCARD" | "UNKNOWN";
  cvc?: string;
  isFlipped?: boolean;
}

export function CreditCardPreview({
  number,
  holderName,
  expiry,
  brand,
  cvc = "",
  isFlipped = false,
}: CreditCardPreviewProps) {
  const shouldReduceMotion = useReducedMotion();
  const digits = number.replace(/\D/g, "").slice(0, 16);
  const displayNumber = digits
    .padEnd(16, "•")
    .match(/.{1,4}/g)
    ?.join(" ") || "•••• •••• •••• ••••";
  const displayName = holderName.trim() || "NOMBRE APELLIDO";
  const displayExpiry = expiry || "MM/YY";

  const themeByBrand: Record<
    CreditCardPreviewProps["brand"],
    { gradient: string; accent: string }
  > = {
    VISA: {
      gradient:
        "linear-gradient(136deg, #0d1b2a 0%, #13253d 42%, #173459 75%, #1b436f 100%)",
      accent: "#8ab4ff",
    },
    MASTERCARD: {
      gradient:
        "linear-gradient(136deg, #230b08 0%, #35110d 42%, #4c1a12 75%, #662416 100%)",
      accent: "#ff9d4d",
    },
    UNKNOWN: {
      gradient:
        "linear-gradient(136deg, #1e293b 0%, #273549 40%, #334155 74%, #415269 100%)",
      accent: "#9fb4cc",
    },
  };

  const activeTheme = themeByBrand[brand];

  const shadow =
    "0 30px 58px -18px rgba(2, 6, 23, 0.66), 0 10px 24px -14px rgba(15, 23, 42, 0.44), inset 0 1px 0 rgba(255,255,255,0.12)";

  return (
    <div className="perspective-1000 w-full max-w-[380px] mx-auto mb-4">
      <motion.div
        className="relative w-full aspect-[1.586/1]"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.enterFadeUp(!!shouldReduceMotion)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 [transition-timing-function:var(--ease-snappy)] transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
          }}
        >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden text-white backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: activeTheme.gradient,
            boxShadow: shadow,
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_18%_12%,rgba(255,255,255,0.14),transparent_56%)]" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_84%_86%,rgba(255,255,255,0.08),transparent_48%)]" />
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeTheme.accent}, transparent)`,
              opacity: 0.84,
            }}
          />
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: "-140%" }}
              animate={{ x: "160%" }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                background:
                  "linear-gradient(112deg, transparent 0%, rgba(255,255,255,0.13) 45%, transparent 100%)",
              }}
            />
          )}

          <div className="relative flex flex-col justify-between h-full p-5">
            <div className="flex items-start justify-between">
              <div>
                {brand === "VISA" ? (
                  <svg
                    viewBox="0 0 80 26"
                    className="w-16 h-auto"
                    role="img"
                    aria-label="Visa"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M30.5 25H23.4L28 1H35.1L30.5 25ZM54.2 1.5C52.8 1 50.5 0.4 47.7 0.4C40.7 0.4 35.7 4 35.7 9.1C35.7 12.9 39.1 15 41.7 16.5C44.4 18 45.3 18.9 45.3 20.2C45.3 22.1 43.1 23 41 23C38.1 23 36.5 22.6 33.9 21.4L32.9 21L31.8 27.5C33.5 28.3 36.6 29 40 29C47.4 29 52.3 25.5 52.3 20C52.3 17 50.4 14.6 46.5 12.6C44.1 11.2 42.6 10.2 42.6 8.8C42.6 7.5 44 6.2 47 6.2C49.5 6.2 51.3 6.7 52.7 7.3L53.4 7.6L54.2 1.5ZM72.7 1H67.3C65.7 1 64.5 1.5 63.8 3.2L53.7 25H61.1L62.6 20.8H71.5L72.4 25H79L72.7 1ZM64.7 15.5C65.2 14.1 67.4 8.2 67.4 8.2C67.4 8.2 67.9 6.8 68.2 5.9L68.6 8C68.6 8 69.9 14 70.2 15.5H64.7ZM17.9 1L11 17.5L10.2 13.5C8.9 9.1 4.8 4.3 0.2 1.9L6.5 25H14L24.3 1H17.9Z"
                      fill="white"
                    />
                  </svg>
                ) : brand === "MASTERCARD" ? (
                  <svg
                    viewBox="0 0 50 32"
                    className="w-11 h-auto"
                    role="img"
                    aria-label="Mastercard"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="18" cy="16" r="14" fill="#EB001B" />
                    <circle cx="32" cy="16" r="14" fill="#F79E1B" />
                    <path
                      d="M25 5.3C27.9 7.4 29.9 10.5 29.9 16C29.9 21.5 27.9 24.6 25 26.7C22.1 24.6 20.1 21.5 20.1 16C20.1 10.5 22.1 7.4 25 5.3Z"
                      fill="#FF5F00"
                    />
                  </svg>
                ) : (
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Tarjeta
                  </p>
                )}
              </div>
              <div className="opacity-75">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                >
                  <path
                    d="M 25.4 35.7 A 25 25 0 0 1 25.4 64.3"
                    stroke="rgba(255,255,255,0.6)"
                  />
                  <path
                    d="M 41.8 24.2 A 45 45 0 0 1 41.8 75.8"
                    stroke="rgba(255,255,255,0.6)"
                  />
                  <path
                    d="M 58.2 12.8 A 65 65 0 0 1 58.2 87.2"
                    stroke="rgba(255,255,255,0.6)"
                  />
                  <path
                    d="M 74.6 1.3 A 85 85 0 0 1 74.6 98.7"
                    stroke="rgba(255,255,255,0.6)"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg
                width="46"
                height="36"
                viewBox="0 0 46 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="45"
                  height="35"
                  rx="5.5"
                  fill="url(#chip-grad-preview)"
                  stroke="#B8902E"
                />
                <line x1="1" y1="12" x2="45" y2="12" stroke="#B8902E" strokeWidth="0.8" />
                <line x1="1" y1="24" x2="45" y2="24" stroke="#B8902E" strokeWidth="0.8" />
                <line x1="15" y1="1" x2="15" y2="35" stroke="#B8902E" strokeWidth="0.8" />
                <line x1="31" y1="1" x2="31" y2="35" stroke="#B8902E" strokeWidth="0.8" />
                <rect
                  x="15"
                  y="12"
                  width="16"
                  height="12"
                  rx="1"
                  fill="#C9982A"
                  stroke="#B8902E"
                  strokeWidth="0.5"
                />
                <defs>
                  <linearGradient
                    id="chip-grad-preview"
                    x1="0"
                    y1="0"
                    x2="46"
                    y2="36"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#E8C55A" />
                    <stop offset="0.42" stopColor="#D4A843" />
                    <stop offset="1" stopColor="#B8902E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <p className="font-mono text-[1.02rem] md:text-lg tracking-[0.14em] font-medium text-white/95">
              {displayNumber}
            </p>

            <div className="flex items-end justify-between">
              <div className="min-w-0 pr-3">
                <p className="uppercase text-[9px] tracking-[0.16em] text-white/46 mb-1">
                  Titular
                </p>
                <p className="font-mono text-[12px] tracking-[0.12em] uppercase text-white/93 truncate">
                  {displayName}
                </p>
              </div>
              <div className="text-right">
                <p className="uppercase text-[9px] tracking-[0.16em] text-white/46 mb-1">
                  Vence
                </p>
                <p className="font-mono text-[12px] tracking-[0.12em] text-white/93">
                  {displayExpiry}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden text-white backface-hidden rotate-y-180"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: activeTheme.gradient,
            boxShadow: shadow,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeTheme.accent}, transparent)`,
              opacity: 0.84,
            }}
          />
          <div className="w-full mt-7 h-11 bg-[linear-gradient(180deg,#0d0d0d_0%,#1a1a1a_50%,#080808_100%)]" />

          <div className="px-5 mt-5 flex items-center gap-3">
            <div className="flex-1 h-9 rounded border border-black/10 bg-[repeating-linear-gradient(90deg,#f5f0e8_0px,#e8dfc8_2px,#f5f0e8_4px)]" />
            <div className="w-14 h-9 rounded bg-white/92 flex flex-col items-center justify-center">
              <p className="text-[8px] leading-none text-slate-400 mb-0.5">CVV</p>
              <span className="text-slate-800 font-mono text-sm tracking-widest font-bold">
                {(cvc || "•••").slice(0, 4)}
              </span>
            </div>
          </div>

          <div className="px-5 mt-4">
            <p className="text-[9px] leading-relaxed text-white/34">
              Esta tarjeta es solo para demostración
            </p>
          </div>

          <div className="absolute bottom-4 right-5 opacity-55">
            {brand === "VISA" ? (
              <svg
                viewBox="0 0 80 26"
                className="w-12 h-auto"
                role="img"
                aria-label="Visa"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M30.5 25H23.4L28 1H35.1L30.5 25ZM54.2 1.5C52.8 1 50.5 0.4 47.7 0.4C40.7 0.4 35.7 4 35.7 9.1C35.7 12.9 39.1 15 41.7 16.5C44.4 18 45.3 18.9 45.3 20.2C45.3 22.1 43.1 23 41 23C38.1 23 36.5 22.6 33.9 21.4L32.9 21L31.8 27.5C33.5 28.3 36.6 29 40 29C47.4 29 52.3 25.5 52.3 20C52.3 17 50.4 14.6 46.5 12.6C44.1 11.2 42.6 10.2 42.6 8.8C42.6 7.5 44 6.2 47 6.2C49.5 6.2 51.3 6.7 52.7 7.3L53.4 7.6L54.2 1.5ZM72.7 1H67.3C65.7 1 64.5 1.5 63.8 3.2L53.7 25H61.1L62.6 20.8H71.5L72.4 25H79L72.7 1ZM64.7 15.5C65.2 14.1 67.4 8.2 67.4 8.2C67.4 8.2 67.9 6.8 68.2 5.9L68.6 8C68.6 8 69.9 14 70.2 15.5H64.7ZM17.9 1L11 17.5L10.2 13.5C8.9 9.1 4.8 4.3 0.2 1.9L6.5 25H14L24.3 1H17.9Z"
                  fill="white"
                />
              </svg>
            ) : brand === "MASTERCARD" ? (
              <svg
                viewBox="0 0 50 32"
                className="w-9 h-auto"
                role="img"
                aria-label="Mastercard"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="18" cy="16" r="14" fill="#EB001B" />
                <circle cx="32" cy="16" r="14" fill="#F79E1B" />
                <path
                  d="M25 5.3C27.9 7.4 29.9 10.5 29.9 16C29.9 21.5 27.9 24.6 25 26.7C22.1 24.6 20.1 21.5 20.1 16C20.1 10.5 22.1 7.4 25 5.3Z"
                  fill="#FF5F00"
                />
              </svg>
            ) : null}
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
