"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Truck,
  Sparkles,
  Pill,
  Stethoscope,
  Activity,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryThreshold,
    amountForFreeDelivery,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCart();

  const shouldReduceMotion = useReducedMotion();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const getProductIcon = (category?: string) => {
    if (category === "Medical Devices") return <Stethoscope className="h-5 w-5 text-blue-700" />;
    if (category === "Vitamins & Supplements") return <Sparkles className="h-5 w-5 text-amber-600" />;
    if (category === "Health & Wellness") return <Activity className="h-5 w-5 text-emerald-600" />;
    return <Pill className="h-5 w-5 text-blue-700" />;
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.aside
            initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart Drawer"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Your Cart ({itemCount})
                </h2>
              </div>

              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close cart drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Delivery Bar */}
            {items.length > 0 && (
              <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <Truck className="h-4 w-4 text-blue-700 shrink-0" />
                  {amountForFreeDelivery > 0 ? (
                    <span>
                      Add <strong className="font-bold">{formatPrice(amountForFreeDelivery)}</strong> more for <strong>FREE Lahore Delivery</strong>
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-800">
                      🎉 You qualified for FREE Lahore Delivery!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Loading your cart items...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Your cart is empty</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Explore authentic medicines, vitamins, and healthcare essentials with doorstep delivery across Lahore.
                    </p>
                  </div>
                  <Button
                    onClick={closeDrawer}
                    size="sm"
                    className="gap-1.5"
                  >
                    <span>Continue Shopping</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="pt-3.5 first:pt-0 flex gap-3.5 items-start group">
                    {/* Item Visual */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                      {getProductIcon(item.product.category)}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={closeDrawer}
                          className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">{item.product.packSize}</p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-600 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold font-display text-slate-900">
                            {formatPrice(item.lineTotal)}
                          </span>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {formatPrice(item.product.price)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & CTAs */}
            {items.length > 0 && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 font-display">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery (Lahore)</span>
                    <span className="font-semibold text-slate-900">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total</span>
                    <span className="font-display text-base text-blue-700">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link href="/cart" onClick={closeDrawer} className="w-full">
                    <Button variant="outline" size="md" className="w-full text-xs font-semibold">
                      View Cart
                    </Button>
                  </Link>

                  <Link href="/checkout" onClick={closeDrawer} className="w-full">
                    <Button size="md" className="w-full text-xs font-semibold gap-1">
                      <span>Checkout</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
