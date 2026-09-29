"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchInfo {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  expiryStatus: string;
}

interface ProductWithBatches {
  id: string;
  name: string;
  sku: string;
  brand: string;
  batches: BatchInfo[];
}

interface AdjustStockFormProps {
  products: ProductWithBatches[];
  initialProductId?: string;
  initialBatchId?: string;
}

export function AdjustStockForm({ products, initialProductId, initialBatchId }: AdjustStockFormProps) {
  const router = useRouter();

  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.id || ""
  );
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const [selectedBatchId, setSelectedBatchId] = useState(
    initialBatchId || selectedProduct?.batches[0]?.id || ""
  );

  // When product changes, reset batch if not present
  useEffect(() => {
    if (selectedProduct && selectedProduct.batches.length > 0) {
      if (!selectedProduct.batches.some((b) => b.id === selectedBatchId)) {
        setSelectedBatchId(selectedProduct.batches[0].id);
      }
    } else {
      setSelectedBatchId("");
    }
  }, [selectedProductId, selectedProduct]);

  const selectedBatch = selectedProduct?.batches.find((b) => b.id === selectedBatchId);

  const [adjustmentType, setAdjustmentType] = useState<
    "DAMAGE" | "EXPIRED" | "CORRECTION" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURN"
  >("DAMAGE");

  const [quantity, setQuantity] = useState<number | "">(1);
  const [notes, setNotes] = useState("");
  const [referenceId, setReferenceId] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDecrease = ["DAMAGE", "EXPIRED", "ADJUSTMENT_OUT", "CORRECTION"].includes(adjustmentType);

  const handleValidateAndOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedBatchId) {
      setError("Please select a valid batch to adjust");
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (!notes.trim() || notes.trim().length < 3) {
      setError("A detailed reason / note is required for the audit trail (min 3 characters)");
      return;
    }

    if (isDecrease && selectedBatch && numQty > selectedBatch.quantity) {
      setError(
        `Cannot reduce ${numQty} units. Selected batch "${selectedBatch.batchNumber}" only has ${selectedBatch.quantity} available.`
      );
      return;
    }

    // If decrease, show confirmation modal
    if (isDecrease) {
      setShowConfirmModal(true);
    } else {
      executeAdjustment();
    }
  };

  const executeAdjustment = async () => {
    setLoading(true);
    setError(null);
    setShowConfirmModal(false);

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchId,
          type: adjustmentType,
          quantity: Number(quantity),
          notes: notes.trim(),
          referenceId: referenceId.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      setSuccess(`Stock adjusted successfully! Recorded ${adjustmentType} for ${quantity} unit(s).`);
      setTimeout(() => {
        router.push(`/admin/inventory/batches/${selectedBatchId}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred while adjusting stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleValidateAndOpenConfirm} className="space-y-6">
        {/* Step 1: Select Product & Batch */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            1. Target Product & Batch
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Product <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Batch <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                disabled={!selectedProduct || selectedProduct.batches.length === 0}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                required
              >
                {selectedProduct && selectedProduct.batches.length > 0 ? (
                  selectedProduct.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {b.quantity} in stock (Exp: {new Date(b.expiryDate).toLocaleDateString()})
                    </option>
                  ))
                ) : (
                  <option value="">No batches registered</option>
                )}
              </select>
            </div>
          </div>

          {selectedBatch && (
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400">Current Batch Quantity:</span>{" "}
                <span className="font-bold text-white text-sm">{selectedBatch.quantity} units</span>
              </div>
              <div>
                <span className="text-slate-400">Expiry Date:</span>{" "}
                <span className="font-semibold text-amber-400">
                  {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedBatch.expiryStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Adjustment Type & Quantity */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-400" />
            2. Adjustment Action & Type
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              {
                type: "DAMAGE",
                label: "Damaged Stock",
                desc: "Broken/damaged packaging",
                action: "DECREASE",
                color: "border-red-800/80 bg-red-950/30 text-red-300",
              },
              {
                type: "EXPIRED",
                label: "Expired Stock",
                desc: "Disposal of expired units",
                action: "DECREASE",
                color: "border-red-800/80 bg-red-950/30 text-red-300",
              },
              {
                type: "ADJUSTMENT_OUT",
                label: "Stock Write-off",
                desc: "Physical count deficit",
                action: "DECREASE",
                color: "border-red-800/80 bg-red-950/30 text-red-300",
              },
              {
                type: "ADJUSTMENT_IN",
                label: "Stock Found / Intake",
                desc: "Physical count surplus",
                action: "INCREASE",
                color: "border-emerald-800/80 bg-emerald-950/30 text-emerald-300",
              },
              {
                type: "RETURN",
                label: "Returned Stock",
                desc: "Customer/verified return",
                action: "INCREASE",
                color: "border-emerald-800/80 bg-emerald-950/30 text-emerald-300",
              },
              {
                type: "CORRECTION",
                label: "Inventory Correction",
                desc: "Administrative fix",
                action: "DECREASE",
                color: "border-amber-800/80 bg-amber-950/30 text-amber-300",
              },
            ].map((opt) => {
              const isSelected = adjustmentType === opt.type;
              return (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setAdjustmentType(opt.type as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `ring-2 ring-blue-500 bg-slate-800 ${opt.color}`
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-white">{opt.label}</p>
                      {opt.action === "INCREASE" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        opt.action === "INCREASE"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-red-950 text-red-300 border border-red-800"
                      }`}
                    >
                      {opt.action}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adjustment Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {isDecrease
                  ? `Will reduce batch stock by ${quantity || 0} unit(s)`
                  : `Will increase batch stock by ${quantity || 0} unit(s)`}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ticket / Audit Reference
              </label>
              <input
                type="text"
                placeholder="e.g. AUDIT-2026-Q3-01"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason & Audit Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain exactly why this stock adjustment is taking place..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-slate-700 bg-slate-800 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={`font-semibold px-6 text-white shadow-md ${
              isDecrease ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {isDecrease ? "Review Stock Reduction" : "Apply Stock Increase"}
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal for Destructive / Reduction Adjustments */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 bg-amber-950/80 rounded-xl border border-amber-800/80">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Stock Reduction</h3>
                <p className="text-xs text-slate-400">This action modifies physical batch stock.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-white">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedBatch?.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-red-400">{adjustmentType} (-{quantity} units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining After:</span>
                <span className="font-bold text-white">
                  {(selectedBatch?.quantity || 0) - Number(quantity)} units
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400">
                <span className="text-slate-500 block text-[11px]">Audit Reason:</span>
                <span className="italic text-slate-300 text-xs">{notes}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              A permanent immutable ledger entry will be logged under your administrator account.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="border-slate-700 bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={executeAdjustment}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
              >
                Confirm & Reduce Stock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
