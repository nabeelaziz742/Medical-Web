"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Pill, Sparkles, Stethoscope, Activity } from "lucide-react";
import { ProductItem } from "@/data/seedProducts";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || product.stockStatus === "OUT_OF_STOCK") return;

    setIsAdding(true);
    const success = await addItem(product.id, 1);
    setIsAdding(false);

    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1800);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const stockBadgeMap = {
    IN_STOCK: { label: "In Stock", variant: "success" as const },
    LOW_STOCK: { label: "Low Stock", variant: "warning" as const },
    OUT_OF_STOCK: { label: "Out of Stock", variant: "danger" as const },
  };

  const stockInfo = stockBadgeMap[product.stockStatus];

  // Pick category icon
  const getProductIcon = () => {
    if (product.categorySlug === "medical-devices") return <Stethoscope className="h-9 w-9 text-blue-700" />;
    if (product.categorySlug === "vitamins-supplements") return <Sparkles className="h-9 w-9 text-amber-600" />;
    if (product.categorySlug === "health-wellness") return <Activity className="h-9 w-9 text-emerald-600" />;
    return <Pill className="h-9 w-9 text-blue-700" />;
  };

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-subtle hover:shadow-card hover:-translate-y-0.5 hover:border-blue-400/80 transition-all duration-250 flex flex-col justify-between overflow-hidden">
      
      {/* Top Media & Actions */}
      <div className="relative p-4 bg-gradient-to-b from-slate-50/90 to-slate-100/50 border-b border-slate-100 flex items-center justify-center min-h-[170px]">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <Badge variant={stockInfo.variant} size="sm">
            {stockInfo.label}
          </Badge>
          {product.comparePrice && product.comparePrice > product.price && (
            <Badge variant="danger" size="sm">
              Save {formatPrice(product.comparePrice - product.price)}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs transition-all duration-200 active:scale-90 hover:scale-110 z-10 cursor-pointer ${
            isWishlisted
              ? "text-red-500 hover:text-red-600 bg-red-50 border-red-200"
              : "text-slate-400 hover:text-red-500 hover:bg-slate-50"
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-red-500" : ""}`} />
        </button>

        {/* Product Visual Area */}
        <Link href={`/products/${product.slug}`} className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-18 h-18 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-250 ease-out">
            {getProductIcon()}
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">
            {product.sku}
          </span>
        </Link>
      </div>

      {/* Content Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          {/* Brand */}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            {product.brand}
          </span>

          {/* Product Title */}
          <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 group-hover:text-blue-700 transition-colors duration-150 line-clamp-1 mt-0.5">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Pack Size */}
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {product.packSize}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold font-display text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-xs text-slate-400 line-through font-normal">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockStatus === "OUT_OF_STOCK"}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs cursor-pointer ${
              isAdded
                ? "bg-emerald-600 text-white shadow-sm"
                : product.stockStatus === "OUT_OF_STOCK"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 text-white active:bg-blue-900 hover:shadow-xs"
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5 animate-scale-check" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
