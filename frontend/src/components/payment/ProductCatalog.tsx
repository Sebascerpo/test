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
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

function StockBar({ stock }: { stock: number }) {
  if (stock <= 0)
    return (
      <span className="text-[11px] font-medium text-destructive">Agotado</span>
    );
  if (stock <= 5)
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < stock ? "bg-orange-400" : "bg-border"}`}
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-orange-500">
          ¡Solo {stock}!
        </span>
      </div>
    );
  return (
    <span className="text-[11px] font-medium text-emerald-600">Disponible</span>
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

export function ProductCatalog({ onSelectProduct }: ProductCatalogProps) {
  const dispatch = useAppDispatch();
  const { transactionResult, selectedProduct } = useAppSelector(
    (s) => s.payment,
  );
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

  const handleSelect = (product: Product) => {
    if (product.stock <= 0) return;
    dispatch(setSelectedProduct({ product, quantity: 1 }));
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
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <article
                  className={`product-card group relative rounded-2xl border border-border bg-card overflow-hidden flex flex-col ${
                    product.stock <= 0
                      ? "opacity-55 grayscale cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => handleSelect(product)}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PackageIcon
                          size={40}
                          className="text-muted-foreground/30"
                        />
                      </div>
                    )}

                    {/* Sold-out overlay */}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-xs font-semibold text-foreground/60 border border-border rounded-full px-3 py-1">
                          Agotado
                        </span>
                      </div>
                    )}

                    {/* Low stock chip */}
                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ¡Últimas {product.stock}!
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    <h2 className="font-semibold text-[15px] leading-snug tracking-tight line-clamp-1 mb-1">
                      {product.name}
                    </h2>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 flex-1">
                      {product.description}
                    </p>

                    {/* Price + stock */}
                    <div className="flex items-end justify-between mt-3 mb-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-tight leading-none">
                          {formatPrice(product.price)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          COP · precio unitario
                        </p>
                      </div>
                      <StockBar stock={product.stock} />
                    </div>

                    {/* CTA */}
                    <button
                      disabled={product.stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(product);
                      }}
                      className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Comprar ahora
                    </button>
                  </div>
                </article>
              </motion.div>
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
