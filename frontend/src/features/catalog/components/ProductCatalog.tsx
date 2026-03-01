"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedProduct, Product } from "@/store/payment-store";
import {
  PackageIcon,
  ShieldCheckIcon,
  ZapIcon,
  TruckIcon,
  StarIcon,
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCatalogProps {
  onSelectProduct?: () => void;
  refreshSignal?: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

function StockBar({ stock }: { stock: number }) {
  if (stock <= 0) return null;

  const isLow = stock <= 5;
  const percentage = Math.min((stock / 20) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${isLow ? "text-orange-500" : "text-emerald-600"}`}
        >
          {isLow ? `¡Solo ${stock} disponibles!` : "Stock disponible"}
        </span>
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden shadow-inner-soft">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full rounded-full ${isLow ? "bg-orange-400" : "bg-emerald-500"}`}
        />
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-6 bg-muted rounded w-1/3 mt-2" />
        <div className="h-10 bg-muted rounded-xl mt-3" />
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  onSelect: (product: Product, quantity: number) => void;
}
function ProductCard({ product, index, onSelect }: ProductCardProps) {
  const [qty, setQty] = useState(1);
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <article
        className={`product-card group relative rounded-[22px] border border-border bg-card overflow-hidden flex flex-col ${
          isOutOfStock ? "cursor-default" : "cursor-pointer"
        }`}
        onClick={() => !isOutOfStock && onSelect(product, qty)}
      >
        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {product.imageUrl ? (
            <>
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                width={640}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${
                  !isOutOfStock
                    ? "group-hover:scale-110"
                    : "grayscale opacity-80"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <PackageIcon size={40} className="text-muted-foreground/20" />
            </div>
          )}

          {/* Sold-out tag */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center glass-dark">
              <div className="px-4 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
                <span className="text-[11px] font-bold text-white uppercase tracking-widest animate-pulse-subtle">
                  Agotado
                </span>
              </div>
            </div>
          )}

          {/* Category Chip */}
          {product.category && !isOutOfStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 shadow-sm">
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
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
              {/* Price + Quantity Selector */}
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background hover:shadow-premium active:scale-90 transition-all disabled:opacity-20"
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background hover:shadow-premium active:scale-90 transition-all disabled:opacity-20"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(product, qty);
                }}
                className="sc-btn-primary hover:shadow-xl transition-all duration-300"
              >
                Comprar ahora
                <ZapIcon size={16} className="fill-current" />
              </button>

              <StockBar stock={product.stock} />
            </>
          )}
        </div>
      </article>
    </motion.div>
  );
}

export function ProductCatalog({
  onSelectProduct,
  refreshSignal = 0,
}: ProductCatalogProps) {
  const dispatch = useAppDispatch();
  const { transactionResult } = useAppSelector((s) => s.payment);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.data || data.products || []);
    } catch {
      setError("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (transactionResult?.status === "APPROVED") fetchProducts();
  }, [transactionResult?.status]);

  useEffect(() => {
    if (refreshSignal > 0) fetchProducts();
  }, [refreshSignal]);

  const handleSelect = (product: Product, quantity: number) => {
    if (product.stock <= 0) return;
    dispatch(setSelectedProduct({ product, quantity }));
    onSelectProduct?.();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* ── Page header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
          Catálogo
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">
              Nuestros Productos
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Tecnología de calidad con envío rápido a todo el país
            </p>
          </div>
          {/* Free shipping banner */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-muted/40 text-sm whitespace-nowrap self-start sm:self-auto">
            <TruckIcon size={14} className="text-foreground/60" />
            <span className="text-foreground/70 font-medium text-xs">
              Envío gratis desde $300.000
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
      >
        {[
          { icon: ShieldCheckIcon, label: "Pago seguro", sub: "SSL 256-bit" },
          { icon: TruckIcon, label: "Envío rápido", sub: "24–48 horas" },
          { icon: StarIcon, label: "Garantía", sub: "12 meses" },
          { icon: ZapIcon, label: "Cuotas", sub: "Sin interés" },
        ].map(({ icon: Icon, label, sub }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background"
          >
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-foreground/60" />
            </div>
            <div>
              <p className="text-xs font-semibold leading-none">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Products grid ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <PackageIcon size={22} className="text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchProducts}
            className="text-sm font-medium underline underline-offset-4 hover:text-foreground text-muted-foreground transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onSelect={handleSelect}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Footer note ──────────────────────────────────────── */}
      {!loading && !error && products.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[11px] text-muted-foreground mt-10 flex items-center justify-center gap-1.5"
        >
          <ShieldCheckIcon size={11} />
          Pagos procesados de forma segura
        </motion.p>
      )}
    </div>
  );
}
