"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight, Pill, Grid, Tag, Sparkles } from "lucide-react";
import { searchCatalogAutocomplete } from "@/lib/catalog";
import { ProductDetail } from "@/data/products";
import { formatPrice } from "@/lib/utils";

interface LiveSearchBarProps {
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

export function LiveSearchBar({
  placeholder = "Search medicines, healthcare products, brands...",
  className = "",
  isMobile = false,
}: LiveSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    products: ProductDetail[];
    categories: { name: string; slug: string; href: string }[];
    brands: { name: string; slug: string; count: number }[];
  }>({ products: [], categories: [], brands: [] });

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced live search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], categories: [], brands: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const res = searchCatalogAutocomplete(query);
      setResults(res);
      setIsLoading(false);
      setIsOpen(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = () => {
    setIsOpen(false);
  };

  const hasResults =
    results.products.length > 0 ||
    results.categories.length > 0 ||
    results.brands.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 sm:left-4 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && hasResults) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-24 rounded-lg border border-slate-300 bg-slate-50/70 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
        />

        {/* Clear / Loading state */}
        <div className="absolute right-20 sm:right-22 flex items-center">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-1" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="absolute right-1 sm:right-1.5 h-8 px-3 sm:px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors shadow-xs cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          {hasResults ? (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              
              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-blue-600" />
                    <span>Medicines & Products</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {results.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={handleSelect}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/70 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {product.brand} • {product.packSize}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs font-bold text-slate-900">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {results.categories.length > 0 && (
                <div className="p-2 bg-slate-50/50">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Grid className="h-3.5 w-3.5 text-blue-600" />
                    <span>Categories</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 px-3 py-1">
                    {results.categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        onClick={handleSelect}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands Section */}
              {results.brands.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-600" />
                    <span>Brands</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 px-3 py-1">
                    {results.brands.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/products?brand=${b.slug}`}
                        onClick={handleSelect}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                      >
                        <span>{b.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Search Results Footer */}
              <div className="p-2.5 bg-blue-50/60 text-center">
                <Link
                  href={`/products?search=${encodeURIComponent(query.trim())}`}
                  onClick={handleSelect}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                  <span>View all results for &quot;{query}&quot;</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>
          ) : (
            <div className="p-6 text-center text-slate-500">
              <p className="text-xs font-semibold text-slate-700">No matching products found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for Panadol, Vitamin C, Liv.52, or Browse Categories</p>
              <Link
                href="/products"
                onClick={handleSelect}
                className="mt-3 inline-block text-xs font-bold text-blue-700 hover:underline"
              >
                Browse Full Catalog
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
