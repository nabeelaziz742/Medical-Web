"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Truck, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryMethod: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [targetPaymentStatus, setTargetPaymentStatus] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchOrder = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) {
        throw new Error("Order not found or access denied");
      }
      const data = await res.json();
      setOrder(data.order);
      setTargetStatus(data.order.status);
      setTargetPaymentStatus(data.order.paymentStatus);
      setInternalNotes(data.order.internalNotes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load order detail");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          paymentStatus: targetPaymentStatus,
          internalNotes: internalNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      setOrder(data.order);
      setSuccessMessage("Order updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving updates.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
        <Clock className="h-6 w-6 animate-spin text-blue-500" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-red-200">{error}</p>
        <Link href="/admin/orders">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-200">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const validTransitions = ALLOWED_STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Orders List</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {order.orderNumber}
            </h1>
            <Badge variant="default" className="text-xs">
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <span>Order Items ({order.items.length})</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Name</th>
                    <th className="py-3 px-4 font-semibold text-center">Unit Price</th>
                    <th className="py-3 px-4 font-semibold text-center">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-medium text-white">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        Rs. {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        Rs. {item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-col items-end space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between w-64">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-semibold text-white">Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-slate-400">Delivery Fee (Lahore):</span>
                <span className="font-semibold text-white">
                  {order.deliveryFee === 0 ? "FREE" : `Rs. ${order.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between w-64 text-emerald-400">
                  <span>Discount:</span>
                  <span>- Rs. {order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between w-64 pt-2 border-t border-slate-800 text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="text-blue-400 font-mono">Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Delivery Address</span>
              </h3>
              <div className="text-xs text-slate-200 space-y-1">
                <p className="font-bold text-white">{order.customerName}</p>
                <p className="leading-relaxed">{order.deliveryAddress}</p>
                <p className="text-slate-400">Method: {order.deliveryMethod.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>Customer Contact & Payment</span>
              </h3>
              <div className="text-xs text-slate-200 space-y-1.5">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{order.customerPhone}</span>
                </p>
                {order.customerEmail && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{order.customerEmail}</span>
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className="font-semibold text-white">{order.paymentMethod.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Status Transition & Admin Notes Form */}
        <div className="space-y-6">
          <form onSubmit={handleUpdate} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5 shadow-lg">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Fulfillment & Review Actions</span>
            </h2>

            {/* Status Transition Select */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Order Fulfillment Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={order.status}>Current: {order.status.replace(/_/g, " ")}</option>
                {validTransitions.map((next) => (
                  <option key={next} value={next}>
                    Transition to: {next.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {validTransitions.length === 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  This order is in a terminal status ({order.status}).
                </p>
              )}
            </div>

            {/* Payment Status Select */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Payment Status
              </label>
              <select
                value={targetPaymentStatus}
                onChange={(e) => setTargetPaymentStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID (Received)</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Internal Pharmacy Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                placeholder="Rider assignment, batch tracking, or pharmacy internal notes..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>Update Order Status</span>
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
