"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Pill, 
  Search, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Edit3, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  genericName?: string;
  brand: string;
  category: string;
  packSize: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stockStatus: string;
  stockCount: number;
  requiresPrescription: boolean;
  isFeatured?: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [rxFilter, setRxFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (brandFilter !== "all") params.append("brand", brandFilter);
      if (rxFilter !== "all") params.append("requiresPrescription", rxFilter);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load products");
      }
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, brandFilter, rxFilter, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white">Admin</Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">Products</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage pharmacy inventory items, pricing, SKUs, and prescription requirements ({totalCount} total).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>Add New Product</span>
            </Button>
          </Link>
          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
            aria-label="Refresh product list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, generic, SKU..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={rxFilter}
            onChange={(e) => {
              setRxFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Prescriptions</option>
            <option value="true">Prescription Required (Rx)</option>
            <option value="false">OTC (Over the Counter)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading product catalog...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-xs">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <Pill className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No products match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">SKU / Generic</th>
                  <th className="py-3.5 px-4 font-semibold">Brand / Category</th>
                  <th className="py-3.5 px-4 font-semibold">Packaging</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Rx Policy</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{prod.name}</p>
                      {prod.isFeatured && (
                        <span className="text-[10px] text-amber-400 font-bold">★ Featured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-blue-400">{prod.sku}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{prod.genericName || "—"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <p className="font-medium text-white">{prod.brand}</p>
                      <p className="text-[10px] text-slate-500">{prod.category}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {prod.packSize}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-[var(--font-heading)]">
                      Rs. {prod.price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {prod.stockStatus === "OUT_OF_STOCK" ? (
                        <Badge variant="danger">Out of Stock ({prod.stockCount})</Badge>
                      ) : prod.stockStatus === "LOW_STOCK" ? (
                        <Badge variant="warning">Low ({prod.stockCount})</Badge>
                      ) : (
                        <Badge variant="success">In Stock ({prod.stockCount})</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {prod.requiresPrescription ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                          Rx Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/products/${prod.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({totalCount} items)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
