import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  SlidersHorizontal,
  History,
  Lock,
  DollarSign,
  Tag,
  Clock,
  Pill,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getBatchDetail } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface BatchDetailPageProps {
  params: Promise<{ batchId: string }>;
}

export default async function AdminBatchDetailPage({ params }: BatchDetailPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { batchId } = await params;
  const data = await getBatchDetail(batchId);

  if (!data) {
    notFound();
  }

  const { batch, product, transactions } = data;

  const getExpiryBadge = (status: string, daysToExpiry: number) => {
    switch (status) {
      case "EXPIRED":
        return (
          <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs">
            <AlertOctagon className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-200">BATCH IS EXPIRED ({Math.abs(daysToExpiry)} days ago)</p>
              <p className="text-[11px] text-red-400/90 mt-0.5">
                This batch is strictly locked from customer sales. Dispose of expired stock via Manual Adjustment.
              </p>
            </div>
          </div>
        );
      case "EXPIRING_SOON":
        return (
          <div className="flex items-center gap-2 p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-300 text-xs">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-200">EXPIRING SOON ({daysToExpiry} days remaining)</p>
              <p className="text-[11px] text-amber-400/90 mt-0.5">
                FEFO algorithm will prioritize selling this batch before later expiring stock.
              </p>
            </div>
          </div>
        );
      case "VALID":
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">VALID STOCK ({daysToExpiry} days until expiry)</p>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Batch is active and eligible for automated FEFO order allocation.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <Link
            href={`/admin/inventory/${product.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {product.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
              Batch: <span className="text-cyan-400 font-mono">{batch.batchNumber}</span>
            </h1>
            {batch.isLocked && (
              <Badge variant="danger" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Product: <Link href={`/admin/inventory/${product.id}`} className="text-blue-400 hover:underline font-semibold">{product.name}</Link> ({product.sku})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/admin/inventory/adjust?productId=${product.id}&batchId=${batch.id}`}>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-1.5 font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust Batch Stock</span>
            </Button>
          </Link>
          <Link href={`/admin/inventory/receive?productId=${product.id}`}>
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
              Receive More Units
            </Button>
          </Link>
        </div>
      </div>

      {/* Expiry Warning Banner */}
      {getExpiryBadge(batch.expiryStatus, batch.daysToExpiry)}

      {/* Batch Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Current Stock</p>
          <p className={`text-2xl font-bold mt-1 ${batch.quantity > 0 ? "text-white" : "text-slate-500"}`}>
            {batch.quantity} units
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Initial: {batch.initialQuantity} units</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Expiry Date</p>
          <p className="text-base font-bold text-white mt-1">
            {new Date(batch.expiryDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mfg: {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : "N/A"}
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Purchase Cost</p>
          <p className="text-xl font-bold text-slate-300 mt-1">Rs. {batch.purchasePrice.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unit acquisition cost</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Selling Price</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">Rs. {batch.sellingPrice.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Current retail price</p>
        </div>
      </div>

      {/* Complete Movement History for this Batch */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Batch Movement Ledger
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Chronological audit trail
          </span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No stock movements recorded for this batch.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Units Changed</th>
                  <th className="py-3 px-4 text-center">Batch Balance After</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Notes / Reason</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === "PURCHASE" || tx.type === "ADJUSTMENT_IN" || tx.type === "RETURN"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : tx.type === "SALE"
                          ? "bg-blue-950 text-blue-400 border border-blue-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={tx.quantity > 0 ? "text-emerald-400" : "text-red-400"}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300 font-medium">
                      {tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {tx.referenceId || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[220px] truncate">
                      {tx.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                      {tx.performedBy || "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
