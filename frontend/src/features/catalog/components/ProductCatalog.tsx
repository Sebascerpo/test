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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { transitions } from "@/lib/motion";
import {
  ProductCard,
  ProductSkeleton,
} from "@/features/catalog/components/ProductCard";

interface ProductCatalogProps {
  onSelectProduct?: () => void;
  refreshSignal?: number;
}

export function ProductCatalog({
  onSelectProduct,
  refreshSignal = 0,
}: ProductCatalogProps) {
  const dispatch = useAppDispatch();
  const shouldReduceMotion = useReducedMotion();
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-10">
      {/* ── Page header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.enterFadeUp(!!shouldReduceMotion)}
        className="mb-8"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
          Catálogo
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-[2rem] sm:text-4xl font-semibold tracking-[-0.03em] leading-[0.98]">
              Nuestros Productos
            </h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-xl">
              Tecnología de calidad con envío rápido a todo el país
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transitions.enterFadeUp(!!shouldReduceMotion, 0.06)}
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
            className="flex items-center gap-2.5 p-3 rounded-xl border border-border surface-elevated shadow-xs"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
          transition={transitions.enterFadeUp(!!shouldReduceMotion, 0.2)}
          className="text-center text-[11px] text-muted-foreground mt-10 flex items-center justify-center gap-1.5"
        >
          <ShieldCheckIcon size={11} />
          Pagos procesados de forma segura
        </motion.p>
      )}
    </div>
  );
}
