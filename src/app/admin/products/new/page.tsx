"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Pill, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("GSK");
  const [category, setCategory] = useState("Medicines");
  const [genericName, setGenericName] = useState("");
  const [packSize, setPackSize] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [comparePrice, setComparePrice] = useState<number | "">("");
  const [sku, setSku] = useState("");
  const [stockCount, setStockCount] = useState<number>(100);
  const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("IN_STOCK");
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [composition, setComposition] = useState("");
  const [usageInfo, setUsageInfo] = useState("");
  const [warnings, setWarnings] = useState("");
  const [storageInfo, setStorageInfo] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto generate slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!name || !slug || !brand || !category || !packSize || !price || !sku || !manufacturer || !description) {
      setError("Please fill in all mandatory product fields.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        slug,
        brand,
        category,
        genericName: genericName.trim() || undefined,
        packSize,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        sku: sku.trim().toUpperCase(),
        stockCount: Number(stockCount),
        stockStatus,
        requiresPrescription,
        isFeatured,
        manufacturer,
        description,
        composition: composition.trim() || undefined,
        usageInfo: usageInfo.trim() || undefined,
        warnings: warnings.trim() || undefined,
        storageInfo: storageInfo.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      setSuccess("Product created successfully! Redirecting to catalog...");
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating product.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Add New Pharmacy Product
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create a medicine, health supplement, or personal care item in the catalog.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
        
        {/* Core Identification */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Product Title / Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Panadol Extra 500mg Tablets"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. panadol-extra-500mg"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Brand *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. GSK, Searle, Abbott"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Medicines, Skin Care"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Generic Formula / Salt
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol + Caffeine"
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            2. Pricing & Inventory Control
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Price (PKR) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 650"
                required
                min={1}
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Compare Price (PKR)
              </label>
              <input
                type="number"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 700"
                min={1}
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                SKU / Barcode *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. MED-PAN-500"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stock Count
              </label>
              <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
                min={0}
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Packaging Size *
              </label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="e.g. 200 Tablets (20 x 10 Blisters)"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Manufacturer *
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. GlaxoSmithKline Pakistan"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Policy Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={requiresPrescription}
                onChange={(e) => setRequiresPrescription(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
              <span>Requires Doctor Prescription (Rx)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
              <span>Feature on Storefront Homepage</span>
            </label>
          </div>
        </div>

        {/* Clinical / Commercial Content */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            3. Product Description & Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Product Overview & Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Factual description of the item, therapeutic indications, or usage..."
              required
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Composition / Ingredients
              </label>
              <textarea
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                rows={2}
                placeholder="Active ingredients and strengths..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usage & Dosage Directions
              </label>
              <textarea
                value={usageInfo}
                onChange={(e) => setUsageInfo(e.target.value)}
                rows={2}
                placeholder="Recommended directions..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link href="/admin/products">
            <Button variant="outline" size="lg" className="border-slate-700 bg-slate-800 text-slate-200">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>Create & Publish Product</span>
          </Button>
        </div>

      </form>
    </div>
  );
}
