"use client";

interface CreditCardPreviewProps {
  number: string;
  holderName: string;
  expiry: string;
  brand: "VISA" | "MASTERCARD" | "UNKNOWN";
  isFlipped?: boolean;
}

export function CreditCardPreview({
  number,
  holderName,
  expiry,
  brand,
  isFlipped = false,
}: CreditCardPreviewProps) {
  const displayNumber = number || "•••• •••• •••• ••••";
  const displayName = holderName || "NOMBRE DEL TITULAR";
  const displayExpiry = expiry || "MM/YY";

  const getBrandColors = () => {
    switch (brand) {
      case "VISA":
        return "from-blue-700 via-blue-600 to-blue-800";
      case "MASTERCARD":
        return "from-orange-600 via-red-500 to-orange-700";
      default:
        return "from-slate-600 via-slate-500 to-slate-700";
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-xs mx-auto mb-4">
      <div
        className={`relative w-full aspect-[1.586/1] transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${getBrandColors()} p-4 text-white shadow-xl backface-hidden`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Card chip */}
          <div className="absolute top-4 left-4">
            <div
              className="w-10 h-8 rounded bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-400"
              style={{
                background:
                  "linear-gradient(135deg, #ffd700 0%, #ffec8b 50%, #daa520 100%)",
              }}
            >
              <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-yellow-600/30 rounded-sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Brand logo */}
          <div className="absolute top-4 right-4">
            {brand === "VISA" ? (
              <span className="text-xl font-bold italic tracking-wider">
                VISA
              </span>
            ) : brand === "MASTERCARD" ? (
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
                <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-90" />
              </div>
            ) : (
              <span className="text-sm font-medium">CARD</span>
            )}
          </div>

          {/* Contactless icon */}
          <div className="absolute top-14 left-4 opacity-60">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8.5 14.5A5 5 0 0 1 7 11a5 5 0 0 1 1.5-3.5" />
              <path d="M11.5 17.5A9 9 0 0 1 5 11a9 9 0 0 1 1.5-5" />
              <path d="M14.5 20.5A13 13 0 0 1 3 11a13 13 0 0 1 2-7" />
            </svg>
          </div>

          {/* Card number */}
          <div className="absolute bottom-12 left-4 right-4">
            <p className="text-lg tracking-widest font-mono">{displayNumber}</p>
          </div>

          {/* Holder name and expiry */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <p className="text-[8px] uppercase tracking-wider opacity-70 mb-0.5">
                Titular
              </p>
              <p className="text-xs uppercase tracking-wide truncate max-w-[140px]">
                {displayName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-wider opacity-70 mb-0.5">
                Vence
              </p>
              <p className="text-xs tracking-wide">{displayExpiry}</p>
            </div>
          </div>
        </div>

        {/* Back of card (CVC side) */}
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 p-4 text-white shadow-xl backface-hidden rotate-y-180`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Magnetic stripe */}
          <div className="absolute top-6 left-0 right-0 h-10 bg-slate-900" />

          {/* CVC area */}
          <div className="absolute top-20 left-0 right-4">
            <div className="bg-white/90 h-8 rounded flex items-center justify-end pr-3">
              <span className="text-slate-800 font-mono text-sm tracking-wider">
                •••
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] text-slate-400 text-center">
              Esta tarjeta es solo para demostración
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
