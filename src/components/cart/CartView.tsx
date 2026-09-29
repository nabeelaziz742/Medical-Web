"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  MapPin,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Phone,
  Pill,
  Sparkles,
  Stethoscope,
  Activity,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function CartView() {
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryThreshold,
    amountForFreeDelivery,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading,
  } = useCart();

  const getProductIcon = (category?: string) => {
    if (category === "Medical Devices") return <Stethoscope className="h-6 w-6 text-blue-700" />;
    if (category === "Vitamins & Supplements") return <Sparkles className="h-6 w-6 text-amber-600" />;
    if (category === "Health & Wellness") return <Activity className="h-6 w-6 text-emerald-600" />;
    return <Pill className="h-6 w-6 text-blue-700" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-32 bg-slate-200 rounded-2xl" />
              <div className="h-32 bg-slate-200 rounded-2xl" />
            </div>
            <div className="lg:col-span-4 h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 text-center shadow-subtle space-y-6">
          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Your cart is currently empty
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Explore authentic medicines, daily vitamins, baby care essentials, and diagnostic devices delivered directly from our RajGarh Road pharmacy in Lahore.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/products">
              <Button size="lg" className="gap-2 font-semibold">
                <span>Start Shopping</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/prescription">
              <Button variant="outline" size="lg" className="font-semibold">
                Upload Prescription
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">{STORE_INFO.service}</p>
                <p className="text-slate-500">Prompt doorstep delivery across Lahore</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Physical Store</p>
                <p className="text-slate-500">{STORE_INFO.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            You have {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/products" className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Continue Shopping</span>
          </Link>

          <button
            onClick={() => clearCart()}
            className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer px-2.5 py-1 rounded hover:bg-red-50"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Free Delivery Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs sm:text-sm text-blue-900 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-700 shrink-0" />
          {amountForFreeDelivery > 0 ? (
            <span>
              Add <strong className="font-bold">{formatPrice(amountForFreeDelivery)}</strong> more to unlock <strong>FREE Home Delivery across Lahore</strong>
            </span>
          ) : (
            <span className="font-semibold text-emerald-800">
              🎉 Congratulations! You have unlocked FREE Home Delivery across Lahore.
            </span>
          )}
        </div>
        <span className="hidden md:inline-block text-xs font-semibold text-blue-700">
          Threshold: {formatPrice(freeDeliveryThreshold)}
        </span>
      </div>

      {/* 2-Column Commerce Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): Items Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* Product Visual & Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {getProductIcon(item.product.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        {item.product.brand}
                      </span>
                      {item.product.requiresPrescription && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                          Rx Required
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-1 mt-0.5">
                      <Link href={`/products/${item.product.slug}`} className="hover:text-blue-700 transition-colors">
                        {item.product.name}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.product.packSize}
                    </p>

                    <div className="sm:hidden mt-2 font-semibold text-slate-900 text-sm">
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-40"
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Line Total on Desktop */}
                  <div className="hidden sm:block text-right min-w-[90px]">
                    <span className="text-base font-bold font-display text-slate-900">
                      {formatPrice(item.lineTotal)}
                    </span>
                    <p className="text-[11px] text-slate-400 font-normal">
                      {formatPrice(item.product.price)} / unit
                    </p>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                    aria-label={`Remove ${item.product.name} from cart`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Lahore Store & Direct Contact Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0" />
              <span>
                100% Genuine Pharmacy Stock from <strong>{STORE_INFO.address}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span>Direct Support: {STORE_INFO.contacts[0].formatted}</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Sticky Order Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-5">
            <h2 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal ({itemCount})</span>
                <span className="font-semibold text-slate-900 font-display">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1">
                  Delivery Fee (Lahore)
                  <Info className="h-3 w-3 text-slate-400" />
                </span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl font-display text-blue-700">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/checkout" className="w-full block">
                <Button size="lg" className="w-full gap-2 font-semibold shadow-md shadow-blue-900/10">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cash on Delivery & Direct Bank Transfer supported
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Dispatched directly from RajGarh Road store
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
