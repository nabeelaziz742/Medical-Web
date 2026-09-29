import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInventoryProducts, getProductInventoryDetail } from "@/lib/inventory";
import { AdjustStockForm } from "@/components/admin/AdjustStockForm";

export const dynamic = "force-dynamic";

interface AdjustPageProps {
  searchParams: Promise<{ productId?: string; batchId?: string }>;
}

export default async function AdminAdjustStockPage({ searchParams }: AdjustPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const resolvedParams = await searchParams;
  const initialProductId = resolvedParams.productId;
  const initialBatchId = resolvedParams.batchId;

  const result = await getInventoryProducts({ filter: "all", limit: 500 });

  // Fetch batches for all products
  const productsWithBatches = await Promise.all(
    result.products.map(async (p) => {
      const detail = await getProductInventoryDetail(p.id);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        batches: detail?.batches || [],
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Inventory Overview</span>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">
            AUDIT & ADJUSTMENT
          </span>
          <span className="text-xs text-slate-400">Manual Stock Corrections</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
          Manual Stock Adjustment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Record stock adjustments for damaged products, expired inventory disposal, physical audit mismatches, or returns.
        </p>
      </div>

      <AdjustStockForm
        products={productsWithBatches}
        initialProductId={initialProductId}
        initialBatchId={initialBatchId}
      />
    </div>
  );
}
