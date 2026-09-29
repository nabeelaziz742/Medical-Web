"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Filter, 
  ArrowUpDown, 
  Search, 
  X, 
  ShoppingBag, 
  Pill, 
  Grid3X3, 
  Grid2X2 
} from "lucide-react";
import { ProductFilterSidebar } from "./ProductFilterSidebar";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getProducts, FilterOptions } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CatalogView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial query params
  const initialCategory = searchParams.get("category") || "all";
  const initialBrand = searchParams.get("brand") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = (searchParams.get("sort") as FilterOptions["sort"]) || "featured";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialPrescription = searchParams.has("prescription")
    ? searchParams.get("prescription") === "true"
    : undefined;

  const [category, setCategory] = useState<string>(initialCategory);
  const [brand, setBrand] = useState<string>(initialBrand);
  const [search, setSearch] = useState<string>(initialSearch);
  const [sort, setSort] = useState<FilterOptions["sort"]>(initialSort);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [prescriptionOnly, setPrescriptionOnly] = useState<boolean | undefined>(initialPrescription);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync with URL params
  const updateUrl = (newParams: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    updateUrl({ category: cat });
  };

  const handleBrandChange = (b: string) => {
    setBrand(b);
    updateUrl({ brand: b });
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    updateUrl({ search: q });
  };

  const handleSortChange = (s: FilterOptions["sort"]) => {
    setSort(s);
    updateUrl({ sort: s });
  };

  const handleInStockChange = (inStock: boolean) => {
    setInStockOnly(inStock);
    updateUrl({ inStock: inStock ? "true" : null });
  };

  const handlePrescriptionChange = (rx: boolean | undefined) => {
    setPrescriptionOnly(rx);
    updateUrl({ prescription: rx === undefined ? null : String(rx) });
  };

  const handleResetFilters = () => {
    setCategory("all");
    setBrand("all");
    setSearch("");
    setSort("featured");
    setInStockOnly(false);
    setPrescriptionOnly(undefined);
    router.replace("/products");
  };

  // Filter products in memory
  const products = useMemo(() => {
    return getProducts({
      search,
      category,
      brand,
      sort,
      inStockOnly,
      prescriptionOnly,
    });
  }, [search, category, brand, sort, inStockOnly, prescriptionOnly]);

  const hasActiveFilters =
    Boolean(category && category !== "all") ||
    Boolean(brand && brand !== "all") ||
    Boolean(search) ||
    Boolean(inStockOnly) ||
    prescriptionOnly !== undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              {search ? `Search Results for "${search}"` : category !== "all" ? `${category.replace(/-/g, " ").toUpperCase()}` : "Medicines & Healthcare Catalog"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Showing {products.length} {products.length === 1 ? "product" : "products"} available from SAAD Medical Store
            </p>
          </div>

          {/* Search Field & Mobile Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Filter by name..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-300 bg-white text-xs focus:border-blue-600 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Filter className="h-3.5 w-3.5 text-blue-700" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-700" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Active Filters:</span>
            {search && (
              <Badge variant="default" size="sm" className="gap-1">
                <span>Search: &quot;{search}&quot;</span>
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleSearchChange("")} />
              </Badge>
            )}
            {category && category !== "all" && (
              <Badge variant="default" size="sm" className="gap-1">
                <span>Category: {category}</span>
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange("all")} />
              </Badge>
            )}
            {brand && brand !== "all" && (
              <Badge variant="default" size="sm" className="gap-1">
                <span>Brand: {brand}</span>
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleBrandChange("all")} />
              </Badge>
            )}
            {inStockOnly && (
              <Badge variant="success" size="sm" className="gap-1">
                <span>In Stock Only</span>
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleInStockChange(false)} />
              </Badge>
            )}
            {prescriptionOnly !== undefined && (
              <Badge variant="secondary" size="sm" className="gap-1">
                <span>{prescriptionOnly ? "Rx Required" : "No Rx Required"}</span>
                <X className="h-3 w-3 cursor-pointer" onClick={() => handlePrescriptionChange(undefined)} />
              </Badge>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-red-600 hover:text-red-700 ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ProductFilterSidebar
            selectedCategory={category}
            selectedBrand={brand}
            inStockOnly={inStockOnly}
            prescriptionOnly={prescriptionOnly}
            onCategoryChange={handleCategoryChange}
            onBrandChange={handleBrandChange}
            onInStockChange={handleInStockChange}
            onPrescriptionChange={handlePrescriptionChange}
            onResetFilters={handleResetFilters}
            totalProductsCount={products.length}
          />
        </div>

        {/* Mobile Slide-out Drawer Filters */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileFiltersOpen(false)} />
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl z-10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-sm text-slate-900">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProductFilterSidebar
                selectedCategory={category}
                selectedBrand={brand}
                inStockOnly={inStockOnly}
                prescriptionOnly={prescriptionOnly}
                onCategoryChange={(c) => {
                  handleCategoryChange(c);
                  setMobileFiltersOpen(false);
                }}
                onBrandChange={(b) => {
                  handleBrandChange(b);
                  setMobileFiltersOpen(false);
                }}
                onInStockChange={(i) => {
                  handleInStockChange(i);
                }}
                onPrescriptionChange={(p) => {
                  handlePrescriptionChange(p);
                  setMobileFiltersOpen(false);
                }}
                onResetFilters={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
                totalProductsCount={products.length}
              />
            </div>
          </div>
        )}

        {/* Product Listing Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Sort & Count Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">
              {products.length} items found
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as FilterOptions["sort"])}
                className="h-8 pl-2 pr-6 rounded border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-subtle space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Pill className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No products matched your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try resetting filters or searching with different terms like Panadol, Liv.52, Vitamin C, or Calcium.
              </p>
              <div>
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
