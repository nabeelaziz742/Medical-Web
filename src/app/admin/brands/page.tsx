"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Tag, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount: number;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (err: any) {
      setError(err.message || "Failed to load brands");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setLogo("");
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setLogo(brand.logo || "");
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingBrand) {
      const generated = val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      setSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : "/api/admin/brands";
      const method = editingBrand ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          logo: logo.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save brand");

      setIsModalOpen(false);
      setSuccess(editingBrand ? "Brand updated successfully" : "Brand created successfully");
      fetchBrands();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving brand");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (brand.productCount > 0) {
      setError(`Cannot delete "${brand.name}" because ${brand.productCount} product(s) are currently associated with this manufacturer. Reassign or remove them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete brand");

      setSuccess(`Brand "${brand.name}" deleted successfully`);
      fetchBrands();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to delete brand");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white">Admin</Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">Brands</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Pharmaceutical Brands & Manufacturers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage pharmaceutical companies, healthcare brands, and suppliers.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Brand</span>
        </Button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingBrand ? "Edit Brand" : "Add New Brand"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. GlaxoSmithKline (GSK)"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. gsk"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Logo Asset (Optional)
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="/images/brands/gsk.png"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingBrand ? "Save Changes" : "Create Brand"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading brands...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Brand / Manufacturer</th>
                <th className="py-3.5 px-4 font-semibold">Identifier Slug</th>
                <th className="py-3.5 px-4 font-semibold text-center">Associated Products</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {brand.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-blue-400">
                    {brand.slug}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200">
                      {brand.productCount} items
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button
                      size="sm"
                      onClick={() => openEditModal(brand)}
                      className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(brand)}
                      disabled={isDeleting}
                      className="h-7 text-xs bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      <span>Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
