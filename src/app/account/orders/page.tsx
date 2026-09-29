"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ArrowRight, Truck, Clock, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { PopulatedOrder } from "@/lib/orders";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          throw new Error("Failed to load orders");
        }
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  const getStatusBadge = (status: PopulatedOrder["status"]) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge variant="default" size="sm">Out for Delivery</Badge>;
      case "DISPATCHED":
        return <Badge variant="default" size="sm">Dispatched</Badge>;
      case "PREPARING":
        return <Badge variant="warning" size="sm">Preparing</Badge>;
      case "CONFIRMED":
        return <Badge variant="success" size="sm">Confirmed</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case "REFUNDED":
        return <Badge variant="secondary" size="sm">Refunded</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your past and ongoing medicine deliveries across Lahore</p>
        </div>
        <Link href="/products">
          <Button size="sm" variant="primary">Shop Catalog</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any orders with SAAD Medical Store yet. Start exploring our pharmacy catalog or upload your prescription.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/products">
              <Button size="sm">Browse Products</Button>
            </Link>
            <Link href="/prescription">
              <Button variant="outline" size="sm">Upload Prescription</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-3 bg-slate-50/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-900 font-display">
                    Order #{order.orderNumber}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <span className="text-xs font-bold font-display text-blue-700 ml-2">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  <p className="font-medium text-slate-700">
                    {order.items.length} {order.items.length === 1 ? "Item" : "Items"} • {order.deliveryMethod === "HOME_DELIVERY" ? "Home Delivery (Lahore)" : "Store Pickup"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                    {order.deliveryArea ? `${order.deliveryArea} • ` : ""}{order.deliveryAddress}
                  </p>
                </div>

                <Link href={`/orders/${order.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <span>Track Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
