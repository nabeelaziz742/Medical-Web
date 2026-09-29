"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Building2,
  Receipt,
  User,
  Pill,
  Sparkles,
  Stethoscope,
  Activity,
} from "lucide-react";
import { PopulatedOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderTrackingViewProps {
  orderId: string;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const [order, setOrder] = useState<PopulatedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load order");
        }

        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || "Could not retrieve order details");
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getProductIcon = (category?: string) => {
    if (category === "Medical Devices") return <Stethoscope className="h-5 w-5 text-blue-700" />;
    if (category === "Vitamins & Supplements") return <Sparkles className="h-5 w-5 text-amber-600" />;
    if (category === "Health & Wellness") return <Activity className="h-5 w-5 text-emerald-600" />;
    return <Pill className="h-5 w-5 text-blue-700" />;
  };

  const getStatusBadge = (status: PopulatedOrder["status"]) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success" size="md">Delivered</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge variant="default" size="md">Out for Delivery</Badge>;
      case "DISPATCHED":
        return <Badge variant="default" size="md">Dispatched</Badge>;
      case "PREPARING":
        return <Badge variant="warning" size="md">Preparing</Badge>;
      case "CONFIRMED":
        return <Badge variant="success" size="md">Confirmed</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="md">Cancelled</Badge>;
      case "REFUNDED":
        return <Badge variant="secondary" size="md">Refunded</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning" size="md">Order Placed (Pending)</Badge>;
    }
  };

  const trackingStages = [
    { key: "PENDING", label: "Order Placed", desc: "Received at SAAD Medical Store" },
    { key: "CONFIRMED", label: "Confirmed", desc: "Verified by pharmacy staff" },
    { key: "PREPARING", label: "Preparing", desc: "Packed at RajGarh Road store" },
    { key: "DISPATCHED", label: "Dispatched", desc: "Handed over to Lahore courier" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Rider is heading to your address" },
    { key: "DELIVERED", label: "Delivered", desc: "Package received safely" },
  ];

  const getStageIndex = (status: PopulatedOrder["status"]) => {
    switch (status) {
      case "CONFIRMED": return 1;
      case "PREPARING": return 2;
      case "DISPATCHED": return 3;
      case "OUT_FOR_DELIVERY": return 4;
      case "DELIVERED": return 5;
      case "PENDING":
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading order details and tracking status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-subtle">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Order Access Error</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {error || "Order not found. Please check your order ID or sign in to your account."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/account/orders">
              <Button size="md">View My Orders</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="md">Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = getStageIndex(order.status);
  const isCancelledOrRefunded = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Confirmation Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Order Placed Successfully
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-PK", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <div>{getStatusBadge(order.status)}</div>
            <span className="text-xs text-slate-500">
              Payment: <strong className="text-slate-800 uppercase">{order.paymentStatus}</strong>
            </span>
          </div>
        </div>

        {/* Tracking Timeline */}
        {!isCancelledOrRefunded ? (
          <div className="pt-2 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Delivery Status (Lahore)
            </h2>

            <div className="relative pt-4 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {trackingStages.map((stage, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={stage.key} className="space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                            isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs"
                              : isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                      </div>

                      <div>
                        <h3 className={`text-xs font-bold ${isDone ? "text-slate-900" : "text-slate-400"}`}>
                          {stage.label}
                        </h3>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold">Order Status: {order.status}</p>
              <p className="text-amber-800">
                If you have questions regarding this order, please contact Sharjeel at {STORE_INFO.contacts[0].formatted}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left (7 cols): Items List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold font-display text-slate-900">
                Order Items ({order.items.length})
              </h2>
              <span className="text-xs text-slate-400">Fixed Price Snapshot</span>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {getProductIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {item.productName}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs sm:text-sm font-bold font-display text-slate-900 shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 font-display">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Home Delivery (Lahore)</span>
                <span className="font-semibold text-slate-900">
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(order.deliveryFee)
                  )}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-xl font-display text-blue-700">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap gap-3">
            <Link href="/account/orders">
              <Button variant="outline" size="md">View All Orders</Button>
            </Link>
            <Link href="/products">
              <Button size="md" className="gap-1.5">
                <span>Continue Shopping</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right (5 cols): Details & Direct Pharmacy Info */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Customer & Address Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              Delivery & Contact
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Customer</span>
                <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                <p className="text-slate-600">{order.customerPhone}</p>
                {order.customerEmail && <p className="text-slate-500">{order.customerEmail}</p>}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Delivery Address</span>
                <p className="font-semibold text-slate-800 leading-relaxed">
                  {order.deliveryAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Payment Method</span>
                <p className="font-bold text-slate-900">
                  {order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Direct Bank Transfer"}
                </p>
              </div>

              {order.internalNotes && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Instructions</span>
                  <p className="text-slate-600 italic">{order.internalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Direct Support Card */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
              <Phone className="h-4 w-4 text-blue-700" />
              <span>Direct Pharmacy Lines</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Have questions about your medicines or dosage? Reach our licensed staff directly on RajGarh Road:
            </p>
            <div className="space-y-1 font-semibold text-slate-800">
              <p>• Sharjeel: <span className="text-blue-700">{STORE_INFO.contacts[0].formatted}</span></p>
              <p>• Sameer: <span className="text-blue-700">{STORE_INFO.contacts[1].formatted}</span></p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
