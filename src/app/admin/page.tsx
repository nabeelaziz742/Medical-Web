import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  ShieldCheck, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Pill,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Boxes,
  Calendar,
  AlertOctagon,
  SlidersHorizontal,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAdminDashboardMetrics } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { overview, recentOrders, prescriptionQueue, stockAttention, inventoryMetrics } = await getAdminDashboardMetrics();

  const getOrderStatusBadge = (status: string) => {
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

  const getRxStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return <Badge variant="success">{status}</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="default">Under Review</Badge>;
      case "NEEDS_CLARIFICATION":
        return <Badge variant="warning">Clarification</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              STORE OPERATIONS
            </span>
            <span className="text-xs text-slate-400">Welcome, {session.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Store Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live operational metrics, orders, prescriptions, and batch inventory for SAAD Medical Store, Lahore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/inventory/receive">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 font-semibold">
              <PlusCircle className="h-4 w-4" />
              <span>Receive Stock</span>
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
              Reports
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
              Coupons
            </Button>
          </Link>
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5">
              <Boxes className="h-4 w-4" />
              <span>Inventory</span>
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Orders */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Orders</span>
            <Package className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-[var(--font-heading)]">{overview.totalOrders}</p>
          <p className="text-[11px] text-slate-500">{overview.pendingOrders} pending</p>
        </div>

        {/* Delivered Revenue */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)] truncate">
            Rs. {overview.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">Delivered total</p>
        </div>

        {/* Units in Stock */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>In-Stock Units</span>
            <Boxes className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
            {(overview as any).totalUnitsInStock?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-indigo-400/80">{overview.totalProducts} products</p>
        </div>

        {/* Low Stock Alert */}
        <Link href="/admin/inventory?filter=low_stock" className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-700/60 transition-colors space-y-1 cursor-pointer">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-[var(--font-heading)]">
            {(overview as any).lowStockCount || 0}
          </p>
          <p className="text-[11px] text-amber-400/80">Needs reorder</p>
        </Link>

        {/* Expiring Soon */}
        <Link href="/admin/inventory?filter=expiring_soon" className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-700/60 transition-colors space-y-1 cursor-pointer">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Expiring Soon</span>
            <Calendar className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-[var(--font-heading)]">
            {(overview as any).expiringSoonCount || 0}
          </p>
          <p className="text-[11px] text-amber-400/80">Within 90 days</p>
        </Link>

        {/* Pending Prescriptions */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Rx Queue</span>
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 font-[var(--font-heading)]">{overview.pendingPrescriptions}</p>
          <p className="text-[11px] text-slate-500">Awaiting review</p>
        </div>
      </div>

      {/* Two Column Grid: Recent Orders & Prescription Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No orders recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order #</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Total</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">{ord.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white truncate max-w-[120px]">{ord.customerName}</p>
                        <p className="text-[10px] text-slate-500">{ord.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">Rs. {ord.total.toLocaleString()}</td>
                      <td className="py-3.5 px-4">{getOrderStatusBadge(ord.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/orders/${ord.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Prescription Review Queue */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Prescription Queue</h2>
            </div>
            <Link href="/admin/prescriptions" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {prescriptionQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No prescriptions pending review.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Rx Number</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {prescriptionQueue.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">{rx.prescriptionNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white truncate max-w-[120px]">{rx.customerName}</p>
                        <p className="text-[10px] text-slate-500">{rx.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4">{getRxStatusBadge(rx.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/prescriptions/${rx.id}`}>
                          <Button size="sm" className="h-7 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30">
                            Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Operational Inventory Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock & Out of Stock */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Low & Out of Stock Attention
              </h2>
            </div>
            <Link href="/admin/inventory?filter=low_stock" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>Manage Stock</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {inventoryMetrics?.lowStockProducts.length === 0 && inventoryMetrics?.outOfStockProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">All catalog products are adequately stocked.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">SKU</th>
                    <th className="py-3 px-4 text-center font-semibold">Current Stock</th>
                    <th className="py-3 px-4 text-center font-semibold">Threshold</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {inventoryMetrics?.outOfStockProducts.map((p) => (
                    <tr key={`oos-${p.id}`} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-400">0</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">10</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/inventory/receive?productId=${p.id}`}>
                          <Button size="sm" className="h-6 px-2 text-[11px] bg-blue-600 hover:bg-blue-700 text-white">
                            +Receive
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {inventoryMetrics?.lowStockProducts.map((p) => (
                    <tr key={`low-${p.id}`} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-400">{p.totalStock}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400">{p.minStockAlert}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/inventory/receive?productId=${p.id}`}>
                          <Button size="sm" className="h-6 px-2 text-[11px] bg-blue-600 hover:bg-blue-700 text-white">
                            +Receive
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expiring Soon & Expired Batches */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Expiry Alerts (FEFO Focus)
              </h2>
            </div>
            <Link href="/admin/inventory?filter=expiring_soon" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>View All Batches</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {inventoryMetrics?.expiringSoonBatches.length === 0 && inventoryMetrics?.expiredBatches.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No batches expiring within the 90-day threshold.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product & Batch</th>
                    <th className="py-3 px-4 text-center font-semibold">Qty</th>
                    <th className="py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {inventoryMetrics?.expiredBatches.map((b) => (
                    <tr key={`exp-${b.id}`} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white truncate max-w-[130px]">{b.productName}</p>
                        <p className="font-mono text-[10px] text-red-400">{b.batchNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-400">{b.quantity}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                          Expired
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/inventory/adjust?productId=${b.productId}&batchId=${b.id}`}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-amber-400 hover:bg-amber-950/40">
                            Dispose
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {inventoryMetrics?.expiringSoonBatches.map((b) => (
                    <tr key={`soon-${b.id}`} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white truncate max-w-[130px]">{b.productName}</p>
                        <p className="font-mono text-[10px] text-cyan-400">{b.batchNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-white">{b.quantity}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          {b.daysToExpiry}d left
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/inventory/batches/${b.id}`}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-blue-400 hover:bg-blue-950/40">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
