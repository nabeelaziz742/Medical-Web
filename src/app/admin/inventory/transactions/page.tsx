import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  History,
  ArrowLeft,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Tag,
  Calendar,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInventoryLedger } from "@/lib/inventory";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    productId?: string;
    batchId?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminStockTransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const resolvedParams = await searchParams;
  const type = resolvedParams.type || "all";
  const productId = resolvedParams.productId;
  const batchId = resolvedParams.batchId;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 25;

  const { transactions, pagination } = await getInventoryLedger({
    type,
    productId,
    batchId,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Inventory Overview</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-400">Append-only Stock Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Stock Movement History & Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of all purchase receipts, FEFO order sales, manual adjustments, and disposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/receive">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs">
              + Receive Stock
            </Button>
          </Link>
          <Link href="/admin/inventory/adjust">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 text-slate-200 text-xs">
              + Adjust Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-sm">
        {[
          { key: "all", label: "All Movements" },
          { key: "PURCHASE", label: "Purchases" },
          { key: "SALE", label: "Sales (Orders)" },
          { key: "DAMAGE", label: "Damaged" },
          { key: "EXPIRED", label: "Expired Disposal" },
          { key: "ADJUSTMENT_IN", label: "Intake Corrections" },
          { key: "ADJUSTMENT_OUT", label: "Write-offs" },
          { key: "RETURN", label: "Returns" },
        ].map((tab) => {
          const isActive = type === tab.key;
          const targetUrl = tab.key === "all" ? "/admin/inventory/transactions" : `/admin/inventory/transactions?type=${tab.key}`;

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

      {/* Transactions Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No stock movements found</p>
              <p className="text-xs text-slate-500 mt-1">No transaction records match the current filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 font-mono">Batch Number</th>
                  <th className="py-3.5 px-4 text-center">Quantity Delta</th>
                  <th className="py-3.5 px-4 text-center">Balance After</th>
                  <th className="py-3.5 px-4">Reference ID</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "PURCHASE" || tx.type === "ADJUSTMENT_IN" || tx.type === "RETURN"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : tx.type === "SALE"
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/inventory/${tx.productId}`}
                        className="font-semibold text-white hover:text-blue-400 transition-colors truncate max-w-[180px] block"
                      >
                        {tx.productName}
                      </Link>
                      {tx.productSku && <span className="text-[10px] text-slate-500 font-mono">{tx.productSku}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {tx.batchId ? (
                        <Link href={`/admin/inventory/batches/${tx.batchId}`} className="hover:underline">
                          {tx.batchNumber || "Batch"}
                        </Link>
                      ) : (
                        tx.batchNumber || "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={tx.quantity > 0 ? "text-emerald-400" : "text-red-400"}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                      {tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {tx.referenceId || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">
                      {tx.notes || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[120px]">
                      {tx.performedBy || "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-white">{pagination.total}</span> entries
            </div>

            <div className="flex items-center gap-2">
              {pagination.hasPrev ? (
                <Link href={`/admin/inventory/transactions?page=${pagination.page - 1}&limit=${pagination.limit}${type !== "all" ? `&type=${type}` : ""}`}>
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-slate-700 bg-slate-800 text-slate-200">
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled className="h-7 px-2.5 text-xs opacity-50 border-slate-800 text-slate-500">
                  Previous
                </Button>
              )}

              <span>Page {pagination.page} of {pagination.totalPages}</span>

              {pagination.hasNext ? (
                <Link href={`/admin/inventory/transactions?page=${pagination.page + 1}&limit=${pagination.limit}${type !== "all" ? `&type=${type}` : ""}`}>
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
