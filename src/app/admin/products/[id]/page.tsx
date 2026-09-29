"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) {
          throw new Error("Product not found");
        }
        const data = await res.json();
        const p = data.product;
        setProduct(p);
        setName(p.name);
        setSlug(p.slug);
        setBrand(p.brand);
        setCategory(p.category);
        setGenericName(p.genericName || "");
        setPackSize(p.packSize);
        setPrice(p.price);
        setComparePrice(p.comparePrice || "");
        setSku(p.sku);
        setStockCount(p.stockCount || 0);
        setStockStatus(p.stockStatus || "IN_STOCK");
        setRequiresPrescription(Boolean(p.requiresPrescription));
        setIsFeatured(Boolean(p.isFeatured));
        setManufacturer(p.manufacturer);
        setDescription(p.description || "");
        setComposition(p.composition || "");
        setUsageInfo(p.usageInfo || "");
        setWarnings(p.warnings || "");
        setStorageInfo(p.storageInfo || "");
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        slug,
        brand,
        category,
        genericName: genericName.trim() || null,
        packSize,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        sku: sku.trim().toUpperCase(),
        stockCount: Number(stockCount),
        stockStatus,
        requiresPrescription,
        isFeatured,
        manufacturer,
        description,
        composition: composition.trim() || null,
        usageInfo: usageInfo.trim() || null,
        warnings: warnings.trim() || null,
        storageInfo: storageInfo.trim() || null,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      setProduct(data.product);
      setSuccess("Product updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
        <Clock className="h-6 w-6 animate-spin text-blue-500" />
        <span>Loading product details...</span>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-red-200">{error}</p>
        <Link href="/admin/products">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-200">
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

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
            Edit Product: {product.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            SKU: <span className="font-mono text-blue-400">{product.sku}</span>
          </p>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Product</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-2xl border border-red-800/60 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Delete Product Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <span className="font-bold text-white">"{product.name}"</span>? This will remove the item from the catalog.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

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
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
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
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
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
            isLoading={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>Save Product Changes</span>
          </Button>
        </div>

      </form>
    </div>
  );
}
