"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  packSize: string;
  price: number;
}

interface ReceiveStockFormProps {
  products: ProductOption[];
  initialProductId?: string;
}

export function ReceiveStockForm({ products, initialProductId }: ReceiveStockFormProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || products[0]?.id || "");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState<number | "">(100);
  const [purchasePrice, setPurchasePrice] = useState<number | "">(0);
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-fill selling price when product changes
  React.useEffect(() => {
    if (selectedProduct) {
      if (!sellingPrice || sellingPrice === 0) {
        setSellingPrice(selectedProduct.price);
      }
      if (!purchasePrice || purchasePrice === 0) {
        setPurchasePrice(Math.round(selectedProduct.price * 0.75));
      }
    }
  }, [selectedProductId, selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId) {
      setError("Please select a product");
      return;
    }

    if (!batchNumber.trim()) {
      setError("Please enter a valid batch number");
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    const numSelling = Number(sellingPrice);
    if (!numSelling || numSelling <= 0) {
      setError("Selling price must be greater than 0");
      return;
    }

    const numPurchase = Number(purchasePrice);
    if (isNaN(numPurchase) || numPurchase < 0) {
      setError("Purchase price cannot be negative");
      return;
    }

    if (!expiryDate) {
      setError("Please enter a valid expiry date");
      return;
    }

    if (manufacturingDate && new Date(expiryDate) < new Date(manufacturingDate)) {
      setError("Expiry date cannot precede manufacturing date");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/inventory/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          batchNumber: batchNumber.trim().toUpperCase(),
          quantity: numQty,
          purchasePrice: numPurchase,
          sellingPrice: numSelling,
          manufacturingDate: manufacturingDate || null,
          expiryDate,
          referenceId: referenceId.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to receive stock");
      }

      setSuccess(`Stock received successfully! Added ${numQty} units into batch ${batchNumber.toUpperCase()}.`);
      setTimeout(() => {
        router.push(`/admin/inventory/${selectedProductId}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Product Selection */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          1. Select Medicine / Product
        </h3>

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
                {p.name} — {p.brand} ({p.sku}) [Rs. {p.price.toLocaleString()}]
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
            <div>
              <span className="font-semibold text-white">{selectedProduct.name}</span>
              <span className="text-slate-500"> • {selectedProduct.category}</span>
            </div>
            <div className="font-mono text-cyan-400">SKU: {selectedProduct.sku}</div>
          </div>
        )}
      </div>

      {/* Batch Information */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Tag className="h-4 w-4 text-blue-400" />
          2. Batch & Quantity Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Batch Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. BATCH-2026-001"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">Unique batch identifier from manufacturer</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Received Quantity (Units) <span className="text-red-400">*</span>
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
            <p className="text-[10px] text-slate-500 mt-1">Number of sealed units received</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Acquisition / Purchase Cost per Unit (PKR) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Selling / Retail Price (PKR) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Dates & Reference */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          3. Manufacturing & Expiry Dates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Manufacturing Date (Optional)
            </label>
            <input
              type="date"
              value={manufacturingDate}
              onChange={(e) => setManufacturingDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Expiry Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">Critical for First Expiry, First Out (FEFO) dispensing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Purchase Order / Supplier Invoice #
            </label>
            <input
              type="text"
              placeholder="e.g. PO-2026-9812"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Internal Ledger Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Received directly from distributor distributor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Confirmation & Submit */}
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
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold px-6"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recording Receipt...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Confirm Stock Receipt
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
