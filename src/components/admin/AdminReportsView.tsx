"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  Boxes,
  TicketPercent,
  Download,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  DollarSign,
  Truck,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

type ReportTab = "sales" | "orders" | "products" | "inventory" | "coupons";
type RangePreset = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";

export function AdminReportsView({ adminName }: { adminName?: string }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [rangePreset, setRangePreset] = useState<RangePreset>("LAST_30_DAYS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        range: rangePreset,
      });
      if (rangePreset === "CUSTOM" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, rangePreset, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      type: activeTab,
      range: rangePreset,
    });
    if (rangePreset === "CUSTOM" && startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }
    window.location.href = `/api/admin/reports/export?${params.toString()}`;
  };

  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: "sales", label: "Sales & Revenue", icon: TrendingUp },
    { key: "orders", label: "Orders & Fulfillment", icon: Package },
    { key: "products", label: "Product Performance", icon: BarChart3 },
    { key: "inventory", label: "Inventory Movements", icon: Boxes },
    { key: "coupons", label: "Promotions & Coupons", icon: TicketPercent },
  ];

  const presets: { key: RangePreset; label: string }[] = [
    { key: "TODAY", label: "Today" },
    { key: "YESTERDAY", label: "Yesterday" },
    { key: "LAST_7_DAYS", label: "Last 7 Days" },
    { key: "LAST_30_DAYS", label: "Last 30 Days" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "LAST_MONTH", label: "Last Month" },
    { key: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              OPERATIONAL REPORTING
            </span>
            <span className="text-xs text-slate-400">Server Aggregation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Store Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accurate financial, order, product, inventory ledger, and coupon statistics.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </Button>
      </div>

      {/* Tabs & Date Preset Filters */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
        {/* Main Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Presets and Custom Inputs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setRangePreset(p.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rangePreset === p.key
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {rangePreset === "CUSTOM" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
          Aggregating store records for {activeTab} report...
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center text-slate-500 text-xs">No data available.</div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: SALES REPORT */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Total Orders</span>
                  <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
                    {reportData.summary?.totalOrders || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">{reportData.dateRange?.label}</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Gross Sales</span>
                  <p className="text-xl font-bold text-white font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.grossSales || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Subtotal sum</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Discounts Given</span>
                  <p className="text-xl font-bold text-amber-400 font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.totalDiscounts || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Coupons & promotions</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Delivery Fees</span>
                  <p className="text-xl font-bold text-cyan-400 font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.totalDeliveryFees || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Courier fees collected</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Net Order Value</span>
                  <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.netSales || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-500">AOV: Rs. {reportData.summary?.averageOrderValue || 0}</p>
                </div>
              </div>

              {/* Payment Settlement Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400">Settled (Paid)</span>
                    <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                      Rs. {(reportData.breakdown?.paid?.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="success">{reportData.breakdown?.paid?.count || 0} Orders</Badge>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-400">Pending Collection (COD)</span>
                    <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                      Rs. {(reportData.breakdown?.pending?.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="warning">{reportData.breakdown?.pending?.count || 0} Orders</Badge>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-red-400">Cancelled / Refunded</span>
                    <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                      Rs. {(reportData.breakdown?.cancelled?.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="danger">{reportData.breakdown?.cancelled?.count || 0} Orders</Badge>
                </div>
              </div>

              {/* Daily Sales Table */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Daily Sales Timeline
                  </h2>
                  <span className="text-xs text-slate-400">
                    {reportData.timeline?.length || 0} Days Recorded
                  </span>
                </div>

                {reportData.timeline?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No sales recorded in this date range.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Date</th>
                          <th className="py-3 px-4 text-center font-semibold">Orders Count</th>
                          <th className="py-3 px-4 text-right font-semibold">Gross Subtotal</th>
                          <th className="py-3 px-4 text-right font-semibold">Discounts</th>
                          <th className="py-3 px-4 text-right font-semibold">Net Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {reportData.timeline?.map((d: any) => (
                          <tr key={d.date} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-medium text-white">{d.date}</td>
                            <td className="py-3 px-4 text-center font-bold">{d.orders}</td>
                            <td className="py-3 px-4 text-right font-mono">Rs. {d.gross.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono text-amber-400">- Rs. {d.discounts.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              Rs. {d.net.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORDER REPORT */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Orders by Status */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Orders by Status
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    {Object.entries(reportData.byStatus || {}).map(([st, cnt]) => (
                      <div key={st} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                        <span className="text-slate-300 font-medium">{st.replace(/_/g, " ")}</span>
                        <Badge variant={st === "DELIVERED" ? "success" : st === "CANCELLED" ? "danger" : "default"}>
                          {Number(cnt)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders by Payment Method */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Payment Method Split
                  </h2>
                  <div className="space-y-3 text-xs">
                    {Object.entries(reportData.byPaymentMethod || {}).map(([method, val]: any) => (
                      <div key={method} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{method.replace(/_/g, " ")}</span>
                          <span className="text-blue-400">{val.count} Orders</span>
                        </div>
                        <p className="text-slate-400 font-mono text-[11px]">
                          Volume: Rs. {val.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders by Payment Status */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Payment Status
                  </h2>
                  <div className="space-y-3 text-xs">
                    {Object.entries(reportData.byPaymentStatus || {}).map(([status, val]: any) => (
                      <div key={status} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{status}</span>
                          <span className={status === "PAID" ? "text-emerald-400" : "text-amber-400"}>
                            {val.count} Orders
                          </span>
                        </div>
                        <p className="text-slate-400 font-mono text-[11px]">
                          Total: Rs. {val.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT PERFORMANCE */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Performance by Category
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reportData.categories?.map((c: any) => (
                    <div key={c.category} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                      <span className="font-semibold text-blue-400">{c.category}</span>
                      <p className="text-base font-bold text-white">Rs. {c.revenue.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500">{c.unitsSold} units ordered</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products Table */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Product Sales Ledger (Actual Order Snapshots)
                  </h2>
                  <span className="text-xs text-slate-400">
                    {reportData.topProducts?.length || 0} Products Sold
                  </span>
                </div>

                {reportData.topProducts?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No product sales in this range.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Product Name</th>
                          <th className="py-3 px-4 font-semibold">Category</th>
                          <th className="py-3 px-4 text-center font-semibold">Units Sold</th>
                          <th className="py-3 px-4 text-center font-semibold">Orders Count</th>
                          <th className="py-3 px-4 text-right font-semibold">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {reportData.topProducts?.map((p: any) => (
                          <tr key={p.productId} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                            <td className="py-3 px-4 text-slate-400">{p.category}</td>
                            <td className="py-3 px-4 text-center font-bold text-blue-400">{p.unitsSold}</td>
                            <td className="py-3 px-4 text-center text-slate-400">{p.ordersCount}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              Rs. {p.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY REPORT */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Total Movements</span>
                  <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
                    {reportData.ledgerSummary?.totalMovements || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Ledger transactions</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-blue-400">Purchases Received</span>
                  <p className="text-xl font-bold text-blue-400 font-[var(--font-heading)]">
                    +{reportData.ledgerSummary?.purchases?.units || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">{reportData.ledgerSummary?.purchases?.transactions || 0} batches</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400">Sales Dispatched</span>
                  <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)]">
                    -{reportData.ledgerSummary?.sales?.units || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">{reportData.ledgerSummary?.sales?.transactions || 0} orders</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400">Damaged Stock</span>
                  <p className="text-xl font-bold text-amber-400 font-[var(--font-heading)]">
                    -{reportData.ledgerSummary?.damage?.units || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Damaged units</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-red-400">Expired Disposal</span>
                  <p className="text-xl font-bold text-red-400 font-[var(--font-heading)]">
                    -{reportData.ledgerSummary?.expired?.units || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Disposed batches</p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-400">Manual Adjustments</span>
                  <p className="text-xl font-bold text-indigo-400 font-[var(--font-heading)]">
                    {reportData.ledgerSummary?.adjustments?.units || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Corrections / Audits</p>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Stock Ledger Transactions
                  </h2>
                </div>

                {reportData.recentTransactions?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No stock movements recorded in this period.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Date & Time</th>
                          <th className="py-3 px-4 font-semibold">Product</th>
                          <th className="py-3 px-4 font-semibold">Batch #</th>
                          <th className="py-3 px-4 font-semibold">Movement Type</th>
                          <th className="py-3 px-4 text-center font-semibold">Quantity</th>
                          <th className="py-3 px-4 font-semibold">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {reportData.recentTransactions?.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 text-slate-400">{new Date(t.createdAt).toLocaleString()}</td>
                            <td className="py-3 px-4 font-semibold text-white">{t.productName}</td>
                            <td className="py-3 px-4 font-mono text-cyan-400">{t.batchNumber || "—"}</td>
                            <td className="py-3 px-4 font-semibold">
                              <span className={t.quantity > 0 ? "text-blue-400" : "text-amber-400"}>
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              <span className={t.quantity > 0 ? "text-emerald-400" : "text-red-400"}>
                                {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">{t.referenceId || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COUPON PERFORMANCE */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Promotions Active in Period</span>
                  <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
                    {reportData.summary?.couponsUsedCount || 0}
                  </p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Total Discounts Granted</span>
                  <p className="text-xl font-bold text-amber-400 font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.totalDiscountGranted || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Order Volume with Coupons</span>
                  <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)]">
                    Rs. {(reportData.summary?.totalRevenueWithCoupons || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Coupon Table */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Coupon Performance Breakdown
                  </h2>
                </div>

                {reportData.coupons?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No coupons redeemed in this period.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Coupon Code</th>
                          <th className="py-3 px-4 font-semibold">Type</th>
                          <th className="py-3 px-4 text-center font-semibold">Uses in Range</th>
                          <th className="py-3 px-4 text-right font-semibold">Total Discount (Rs.)</th>
                          <th className="py-3 px-4 text-right font-semibold">Order Value Generated</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {reportData.coupons?.map((c: any) => (
                          <tr key={c.code} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono font-bold text-blue-400">{c.code}</td>
                            <td className="py-3 px-4 text-slate-400">{c.discountType}</td>
                            <td className="py-3 px-4 text-center font-bold text-white">{c.usageCountInRange}</td>
                            <td className="py-3 px-4 text-right font-mono text-amber-400">
                              Rs. {c.totalDiscountsGiven.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              Rs. {c.totalOrderValueGenerated.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={c.status === "ACTIVE" ? "success" : "outline"}>
                                {c.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
