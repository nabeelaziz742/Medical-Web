import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PlusCircle, Boxes, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInventoryProducts } from "@/lib/inventory";
import { ReceiveStockForm } from "@/components/admin/ReceiveStockForm";

export const dynamic = "force-dynamic";

interface ReceivePageProps {
  searchParams: Promise<{ productId?: string }>;
}

export default async function AdminReceiveStockPage({ searchParams }: ReceivePageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const resolvedParams = await searchParams;
  const initialProductId = resolvedParams.productId;

  const result = await getInventoryProducts({ filter: "all", limit: 500 });
  const products = result.products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    category: p.category,
    packSize: p.packSize,
    price: p.price,
  }));

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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
            CONTROLLED INTAKE
          </span>
          <span className="text-xs text-slate-400">Stock Receiving & Batch Logging</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
          Stock Receiving / Purchase Entry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Record newly received medicine batches with manufacturing and expiry tracking. Updates inventory ledger automatically.
        </p>
      </div>

      <ReceiveStockForm products={products} initialProductId={initialProductId} />
    </div>
  );
}
