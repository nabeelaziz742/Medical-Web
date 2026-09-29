"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  RefreshCw,
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryArea?: string | null;
  deliveryNotes?: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CONFIRMED":
      case "PREPARING":
      case "DISPATCHED":
      case "OUT_FOR_DELIVERY":
        return <Badge variant="default">{status.replace(/_/g, " ")}</Badge>;
      case "CANCELLED":
      case "REFUNDED":
        return <Badge variant="danger">{status}</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">PAID</span>;
      case "REFUNDED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800">REFUNDED</span>;
      case "FAILED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800">FAILED</span>;
      case "PENDING":
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white">Admin</Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage pharmacy orders, delivery fulfillment, and payment statuses ({totalCount} total).
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order #, customer, phone, area..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Order Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading orders...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-xs">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <Package className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No orders match the selected filters.</p>
            <p className="text-slate-500">Try adjusting your search criteria or clear status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Area / Locality</th>
                  <th className="py-3.5 px-4 font-semibold">Items</th>
                  <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Fulfillment Status</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-blue-300 border border-slate-700">
                        {order.deliveryArea || "Lahore"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-semibold">{order.items?.length || 0}</span> item(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-[var(--font-heading)]">
                      Rs. {order.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
                          View Order
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({totalCount} orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
