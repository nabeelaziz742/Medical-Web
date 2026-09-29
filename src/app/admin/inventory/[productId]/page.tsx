import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  PlusCircle,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Tag,
  Clock,
  History,
  TrendingDown,
  Eye,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getProductInventoryDetail } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface ProductInventoryPageProps {
  params: Promise<{ productId: string }>;
}

export default async function AdminProductInventoryPage({ params }: ProductInventoryPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { productId } = await params;
  const data = await getProductInventoryDetail(productId);

  if (!data) {
    notFound();
  }

  const { product, batches, transactions } = data;

  const getExpiryBadge = (status: string, daysToExpiry: number) => {
    switch (status) {
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800/60">
            <AlertOctagon className="h-3 w-3" />
            Expired ({Math.abs(daysToExpiry)}d ago)
          </span>
        );
      case "EXPIRING_SOON":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="h-3 w-3" />
            Expiring Soon ({daysToExpiry}d)
          </span>
        );
      case "VALID":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3" />
            Valid ({daysToExpiry}d)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Inventory Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
              {product.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
              {product.sku}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {product.brand} • {product.category} • {product.packSize} • Rs. {product.price.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/admin/inventory/receive?productId=${product.id}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 font-semibold">
              <PlusCircle className="h-4 w-4" />
              <span>Receive New Batch</span>
            </Button>
          </Link>
          <Link href={`/admin/inventory/adjust?productId=${product.id}`}>
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust Stock</span>
            </Button>
          </Link>
          <Link href={`/admin/products/${product.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Edit Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Stock Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Total Physical Stock</p>
          <p className="text-2xl font-bold text-white mt-1">{product.totalStock} units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {batches.length} batch(es)</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Available for Sale</p>
          <p className={`text-2xl font-bold mt-1 ${product.availableStock > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {product.availableStock} units
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unexpired & Unlocked</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Reorder Threshold</p>
          <p className="text-2xl font-bold text-slate-300 mt-1">{product.minStockAlert} units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Min stock alert trigger</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Stock Status</p>
          <div className="mt-2">
            {product.stockStatus === "OUT_OF_STOCK" ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : product.stockStatus === "LOW_STOCK" ? (
              <Badge variant="warning">Low Stock Alert</Badge>
            ) : (
              <Badge variant="success">Adequately Stocked</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Batches Breakdown Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Batches Breakdown (FEFO Order)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Sorted by earliest expiry date first
          </span>
        </div>

        <div className="overflow-x-auto">
          {batches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No batches registered for this product. Use "Receive New Batch" to add stock.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Expiry Status</th>
                  <th className="py-3 px-4 text-right">Purchase Cost</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Remaining Stock</th>
                  <th className="py-3 px-4 text-center">Initial Qty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      {new Date(batch.expiryDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {getExpiryBadge(batch.expiryStatus, batch.daysToExpiry)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      Rs. {batch.purchasePrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-white">
                      Rs. {batch.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold ${batch.quantity > 0 ? "text-white" : "text-slate-500"}`}>
                        {batch.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {batch.initialQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/inventory/batches/${batch.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:text-white">
                            <Eye className="h-3 w-3 mr-1 text-blue-400" />
                            Detail
                          </Button>
                        </Link>
                        <Link href={`/admin/inventory/adjust?productId=${product.id}&batchId=${batch.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/40">
                            Adjust
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
      </div>

      {/* Stock Transaction Ledger for this product */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Stock Movement History
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Immutable transaction ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No stock movements recorded for this product yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 font-mono">Batch</th>
                  <th className="py-3 px-4 text-center">Change (Units)</th>
                  <th className="py-3 px-4 text-center">Balance After</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
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
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {tx.batchNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={tx.quantity > 0 ? "text-emerald-400" : "text-red-400"}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {tx.referenceId || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
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
