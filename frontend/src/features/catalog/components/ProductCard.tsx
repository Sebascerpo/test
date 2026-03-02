"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Product } from "@/store/payment-store";
import {
  PackageIcon,
  ShoppingBagIcon,
} from "@/components/icons";
import { transitions } from "@/lib/motion";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

const resolveProductImageSrc = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/products/")) {
    return imageUrl.replace("/products/", "/api/products/");
  }
  return imageUrl;
};

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border surface-elevated overflow-hidden">
      <div className="aspect-[4/3] bg-muted skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4 skeleton-shimmer" />
        <div className="h-3 bg-muted rounded w-full skeleton-shimmer" />
        <div className="h-3 bg-muted rounded w-2/3 skeleton-shimmer" />
        <div className="h-6 bg-muted rounded w-1/3 mt-2 skeleton-shimmer" />
        <div className="h-10 bg-muted rounded-xl mt-3 skeleton-shimmer" />
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  onSelect: (product: Product, quantity: number) => void;
}

export function ProductCard({ product, index, onSelect }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const isOutOfStock = product.stock <= 0;

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qty < product.stock) setQty((q) => q + 1);
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qty > 1) setQty((q) => q - 1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.listStagger(index, !!shouldReduceMotion)}
    >
      <article
        className={`product-card group relative rounded-[22px] border border-border surface-elevated overflow-hidden flex flex-col ${
          isOutOfStock ? "cursor-default" : "cursor-pointer"
        }`}
        onClick={() => !isOutOfStock && onSelect(product, qty)}
      >
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {resolveProductImageSrc(product.imageUrl) ? (
            <>
              <img
                src={resolveProductImageSrc(product.imageUrl) || undefined}
                alt={product.name}
                loading="lazy"
                decoding="async"
                width={640}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 [transition-timing-function:var(--ease-snappy)] ${
                  !isOutOfStock
                    ? "group-hover:scale-110"
                    : "grayscale opacity-80"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 [transition-timing-function:var(--ease-smooth)]" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <PackageIcon size={40} className="text-muted-foreground/20" />
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center glass-dark">
              <div className="px-4 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
                <span className="text-[11px] font-bold text-white uppercase tracking-widest animate-pulse-subtle">
                  Agotado
                </span>
              </div>
            </div>
          )}

          {product.category && !isOutOfStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 shadow-sm">
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                {product.category}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-5 space-y-4">
          <div className="space-y-1.5">
            <h2 className="font-bold text-[16px] leading-tight tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h2>
            <p className="text-muted-foreground text-[13px] leading-snug line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="flex-1" />

          {isOutOfStock ? (
            <div className="py-4 px-3 rounded-2xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center gap-1.5">
              <PackageIcon size={16} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground/80">
                Este producto volverá pronto
              </p>
              <p className="text-[11px] text-muted-foreground">
                Estamos trabajando para tenerlo de nuevo.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    {qty} {qty === 1 ? "unidad" : "unidades"}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                    {formatPrice(product.price * qty)}
                  </p>
                  {qty > 1 && (
                    <p className="text-[10px] font-medium text-muted-foreground mt-1.5">
                      {formatPrice(product.price)} cada uno
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center bg-secondary/80 rounded-[14px] p-1 border border-border/50 shadow-inner-soft"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={decrement}
                    disabled={qty <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background hover:shadow-premium active:scale-[0.92] transition-all duration-150 [transition-timing-function:var(--ease-snappy)] disabled:opacity-20"
                  >
                    <span className="text-lg font-bold leading-none">−</span>
                  </button>
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold tabular-nums">
                      {qty}
                    </span>
                  </div>
                  <button
                    onClick={increment}
                    disabled={qty >= product.stock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background hover:shadow-premium active:scale-[0.92] transition-all duration-150 [transition-timing-function:var(--ease-snappy)] disabled:opacity-20"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                </div>
              </div>

              <button
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(product, qty);
                }}
                className="sc-btn-primary hover:shadow-premium transition-all duration-300"
              >
                Comprar ahora
                <ShoppingBagIcon
                  size={16}
                  className="transition-transform duration-200 [transition-timing-function:var(--ease-snappy)] group-hover:translate-x-0.5"
                />
              </button>
            </>
          )}
        </div>
      </article>
    </motion.div>
  );
}
