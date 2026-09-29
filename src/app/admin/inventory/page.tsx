import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Boxes,
  PlusCircle,
  SlidersHorizontal,
  History,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  PackageCheck,
  Eye,
  TrendingDown,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInventoryProducts, getInventoryDashboardMetrics } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const filter = (resolvedParams.filter || "all") as any;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 15;
  const sortBy = (resolvedParams.sortBy || "name") as any;
  const sortOrder = (resolvedParams.sortOrder || "asc") as any;

  const [inventoryData, metrics] = await Promise.all([
    getInventoryProducts({
      search,
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    getInventoryDashboardMetrics(),
  ]);

  const { products, pagination } = inventoryData;

  const getStockStatusBadge = (status: string, count: number) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Out of Stock (0)
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Low Stock ({count})
          </span>
        );
      case "IN_STOCK":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock ({count})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              PHARMACY OPERATIONS
            </span>
            <span className="text-xs text-slate-400">Batches & Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Inventory & Stock Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track product batches, expiry dates, FEFO allocations, and immutable ledger movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/inventory/receive">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 font-semibold">
              <PlusCircle className="h-4 w-4" />
              <span>Receive Stock</span>
            </Button>
          </Link>
          <Link href="/admin/inventory/adjust">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust Stock</span>
            </Button>
          </Link>
          <Link href="/admin/inventory/transactions">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 font-medium">
              <History className="h-4 w-4" />
              <span>Movement Ledger</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Stock Units</span>
            <Boxes className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white tracking-tight">{metrics.counts.totalUnits.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{metrics.counts.totalProducts} active SKUs</p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Batches</span>
            <PackageCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white tracking-tight">{metrics.counts.totalBatchesCount}</p>
            <p className="text-[11px] text-indigo-400/80 mt-0.5">Independently traceable</p>
          </div>
        </div>

        <Link
          href="/admin/inventory?filter=low_stock"
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
            filter === "low_stock"
              ? "bg-amber-950/40 border-amber-600/60 ring-1 ring-amber-500/50"
              : "bg-slate-900/80 border-slate-800 hover:border-amber-700/50 hover:bg-slate-850"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-400 tracking-tight">{metrics.counts.lowStockCount}</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Below reorder alert</p>
          </div>
        </Link>

        <Link
          href="/admin/inventory?filter=expiring_soon"
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
            filter === "expiring_soon"
              ? "bg-amber-950/40 border-amber-600/60 ring-1 ring-amber-500/50"
              : "bg-slate-900/80 border-slate-800 hover:border-amber-700/50 hover:bg-slate-850"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Expiring Soon</span>
            <Calendar className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-400 tracking-tight">{metrics.counts.expiringSoonCount}</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Within 90 days</p>
          </div>
        </Link>

        <Link
          href="/admin/inventory?filter=expired"
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
            filter === "expired"
              ? "bg-red-950/40 border-red-600/60 ring-1 ring-red-500/50"
              : "bg-slate-900/80 border-slate-800 hover:border-red-700/50 hover:bg-slate-850"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Expired Stock</span>
            <AlertOctagon className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-red-400 tracking-tight">{metrics.counts.expiredCount}</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">Locked from sale</p>
          </div>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: "all", label: "All Items" },
            { key: "low_stock", label: `Low Stock (${metrics.counts.lowStockCount})` },
            { key: "expiring_soon", label: `Expiring Soon (${metrics.counts.expiringSoonCount})` },
            { key: "expired", label: `Expired (${metrics.counts.expiredCount})` },
            { key: "out_of_stock", label: `Out of Stock (${metrics.counts.outOfStockCount})` },
            { key: "in_stock", label: "In Stock" },
          ].map((tab) => {
            const isActive = filter === tab.key;
            const targetUrl = tab.key === "all" 
              ? `/admin/inventory${search ? `?search=${encodeURIComponent(search)}` : ""}`
              : `/admin/inventory?filter=${tab.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

            return (
              <Link
                key={tab.key}
                href={targetUrl}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Search Form */}
        <form method="GET" action="/admin/inventory" className="flex items-center gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search product, SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-8 px-3 text-xs border-slate-700 bg-slate-800 text-slate-200">
            Search
          </Button>
          {search && (
            <Link href={filter === "all" ? "/admin/inventory" : `/admin/inventory?filter=${filter}`}>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs text-slate-400 hover:text-white">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Boxes className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No inventory products found</p>
              <p className="text-xs text-slate-500 mt-1">
                {search ? "Try adjusting your search query or filter." : "No products match the selected filter."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">Product Name & Category</th>
                  <th className="py-3.5 px-4 font-mono">SKU</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center">Total Stock</th>
                  <th className="py-3.5 px-4 text-center">Sellable Stock</th>
                  <th className="py-3.5 px-4 text-center">Batches</th>
                  <th className="py-3.5 px-4">Expiry Attention</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white max-w-[220px] truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.brand} • <span className="text-slate-500">{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-medium">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-white">
                      Rs. {item.price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-white">{item.totalStock}</span>
                      <span className="text-[10px] text-slate-500 block">units</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold ${item.availableStock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.availableStock}
                      </span>
                      <span className="text-[10px] text-slate-500 block">unexpired</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.batchesCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.hasExpired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                          <AlertOctagon className="h-3 w-3" />
                          Has Expired
                        </span>
                      ) : item.hasExpiringSoon ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Valid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStockStatusBadge(item.stockStatus, item.totalStock)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/inventory/${item.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 flex items-center gap-1">
                            <Eye className="h-3 w-3 text-blue-400" />
                            <span>Batches</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/inventory/receive?productId=${item.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40">
                            +Stock
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-white">{pagination.total}</span> products
            </div>

            <div className="flex items-center gap-2">
              {pagination.hasPrev ? (
                <Link
                  href={`/admin/inventory?page=${pagination.page - 1}&limit=${pagination.limit}${
                    filter !== "all" ? `&filter=${filter}` : ""
                  }${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                >
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-slate-700 bg-slate-800 text-slate-200">
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled className="h-7 px-2.5 text-xs opacity-50 border-slate-800 text-slate-500">
                  Previous
                </Button>
              )}

              <span className="text-xs font-medium text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              {pagination.hasNext ? (
                <Link
                  href={`/admin/inventory?page=${pagination.page + 1}&limit=${pagination.limit}${
                    filter !== "all" ? `&filter=${filter}` : ""
                  }${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                >
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-slate-700 bg-slate-800 text-slate-200">
                    Next
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled className="h-7 px-2.5 text-xs opacity-50 border-slate-800 text-slate-500">
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
