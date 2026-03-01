"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedProduct, Product } from "@/store/payment-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PackageIcon, CreditCardIcon, ZapIcon } from "@/components/icons";
import { motion } from "framer-motion";

interface ProductCatalogProps {
  onSelectProduct?: () => void;
}

export function ProductCatalog({ onSelectProduct }: ProductCatalogProps) {
  const dispatch = useAppDispatch();
  const { selectedProduct, transactionResult } = useAppSelector(
    (state) => state.payment,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get updated stock from transaction result
  const updatedStock =
    transactionResult?.status === "APPROVED" && selectedProduct
      ? { productId: selectedProduct.id, newStock: selectedProduct.stock - 1 }
      : null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // API is proxied through Next.js to NestJS backend
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data.data || data.products || []);
      } catch (err) {
        setError("Error al cargar los productos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Refresh products after successful transaction
  useEffect(() => {
    if (transactionResult?.status === "APPROVED") {
      const refreshProducts = async () => {
        try {
          const response = await fetch("/api/products");
          const data = await response.json();
          setProducts(data.data || data.products || []);
        } catch (err) {
          console.error("Error refreshing products:", err);
        }
      };
      refreshProducts();
    }
  }, [transactionResult?.status]);

  const handleSelectProduct = (product: Product) => {
    if (product.stock <= 0) return;
    dispatch(setSelectedProduct({ product, quantity: 1 }));
    if (onSelectProduct) {
      onSelectProduct();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock <= 0)
      return { label: "Agotado", color: "destructive", progress: 0 };
    if (stock <= 5)
      return {
        label: `¡Solo ${stock}!`,
        color: "warning",
        progress: Math.min((stock / 30) * 100, 100),
      };
    if (stock <= 10)
      return {
        label: "Pocas unidades",
        color: "low",
        progress: Math.min((stock / 30) * 100, 100),
      };
    return { label: "Disponible", color: "success", progress: 100 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Nuestros Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            Encuentra los mejores productos de tecnología
          </p>
        </motion.div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-lg p-3 border border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ZapIcon size={16} className="text-primary" />
            </div>
            <p className="text-sm">
              <span className="font-medium">Envío gratis</span>
              <span className="text-muted-foreground">
                {" "}
                en compras mayores a $300.000
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product, index) => {
          const stockStatus = getStockStatus(product.stock);

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={`overflow-hidden transition-all duration-200 group ${
                  product.stock <= 0
                    ? "opacity-50 grayscale"
                    : "hover:shadow-lg hover:border-primary/30 cursor-pointer active:scale-[0.98]"
                }`}
                onClick={() => handleSelectProduct(product)}
              >
                {/* Image Container - Fixed aspect ratio with overflow hidden */}
                <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PackageIcon
                        size={48}
                        className="text-slate-300 dark:text-slate-600"
                      />
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Agotado
                      </Badge>
                    </div>
                  )}

                  {/* Low stock badge */}
                  {product.stock > 0 && product.stock <= 5 && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px] px-2"
                    >
                      ¡Últimas {product.stock}!
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-base line-clamp-1">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {product.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-2 px-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Stock</span>
                      <span
                        className={`font-medium ${
                          product.stock <= 5 && product.stock > 0
                            ? "text-amber-600"
                            : product.stock <= 0
                              ? "text-destructive"
                              : "text-green-600"
                        }`}
                      >
                        {stockStatus.label}
                      </span>
                    </div>
                    <Progress
                      value={stockStatus.progress}
                      className={`h-1 ${
                        product.stock <= 5 && product.stock > 0
                          ? "[&>div]:bg-amber-500"
                          : product.stock <= 0
                            ? "[&>div]:bg-destructive"
                            : "[&>div]:bg-green-500"
                      }`}
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-0 px-4 pb-3">
                  <Button
                    className="w-full text-sm h-9"
                    disabled={product.stock <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProduct(product);
                    }}
                  >
                    <CreditCardIcon size={14} className="mr-1.5" />
                    Pagar con Tarjeta
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { icon: "", title: "Pago Seguro", desc: "SSL 256-bit" },
          { icon: "", title: "Envío Rápido", desc: "24-48 horas" },
          { icon: "", title: "Garantía", desc: "12 meses" },
          { icon: "", title: "Cuotas", desc: "Sin interés" },
        ].map((badge, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border"
          >
            <span className="text-lg">{badge.icon}</span>
            <div>
              <p className="font-medium text-xs">{badge.title}</p>
              <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          <span className="text-base"></span>
          Pagos seguros procesados
        </p>
      </div>
    </div>
  );
}
