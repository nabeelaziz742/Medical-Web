"use client";

import React from "react";
import { Filter, X, Check } from "lucide-react";
import { CATEGORIES_NAV } from "@/lib/constants";
import { BRANDS } from "@/data/products";

interface FilterSidebarProps {
  selectedCategory?: string;
  selectedBrand?: string;
  inStockOnly?: boolean;
  prescriptionOnly?: boolean;
  onCategoryChange: (category: string) => void;
  onBrandChange: (brand: string) => void;
  onInStockChange: (inStock: boolean) => void;
  onPrescriptionChange: (prescription: boolean | undefined) => void;
  onResetFilters: () => void;
  totalProductsCount: number;
}

export function ProductFilterSidebar({
  selectedCategory,
  selectedBrand,
  inStockOnly,
  prescriptionOnly,
  onCategoryChange,
  onBrandChange,
  onInStockChange,
  onPrescriptionChange,
  onResetFilters,
  totalProductsCount,
}: FilterSidebarProps) {
  const hasActiveFilters =
    Boolean(selectedCategory && selectedCategory !== "all") ||
    Boolean(selectedBrand && selectedBrand !== "all") ||
    Boolean(inStockOnly) ||
    prescriptionOnly !== undefined;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-700" />
          <h3 className="font-bold text-sm text-slate-900">Filter Products</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Categories
        </h4>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
              !selectedCategory || selectedCategory === "all"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>All Categories</span>
            {(!selectedCategory || selectedCategory === "all") && (
              <Check className="h-3.5 w-3.5 text-blue-700" />
            )}
          </button>

          {CATEGORIES_NAV.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onCategoryChange(cat.slug)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                selectedCategory === cat.slug
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{cat.name}</span>
              {selectedCategory === cat.slug && (
                <Check className="h-3.5 w-3.5 text-blue-700" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Brands
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onBrandChange("all")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
              !selectedBrand || selectedBrand === "all"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>All Brands</span>
            {(!selectedBrand || selectedBrand === "all") && (
              <Check className="h-3.5 w-3.5 text-blue-700" />
            )}
          </button>

          {BRANDS.map((brand) => (
            <button
              key={brand.slug}
              type="button"
              onClick={() => onBrandChange(brand.slug)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                selectedBrand === brand.slug
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{brand.name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {brand.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Availability
        </h4>
        <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(inStockOnly)}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-slate-300"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Prescription Requirement */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Prescription
        </h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="radio"
              name="prescription"
              checked={prescriptionOnly === undefined}
              onChange={() => onPrescriptionChange(undefined)}
              className="text-blue-700 focus:ring-blue-600"
            />
            <span>All Products</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="radio"
              name="prescription"
              checked={prescriptionOnly === false}
              onChange={() => onPrescriptionChange(false)}
              className="text-blue-700 focus:ring-blue-600"
            />
            <span>OTC / No Prescription Needed</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="radio"
              name="prescription"
              checked={prescriptionOnly === true}
              onChange={() => onPrescriptionChange(true)}
              className="text-blue-700 focus:ring-blue-600"
            />
            <span>Prescription Required (Rx)</span>
          </label>
        </div>
      </div>

    </div>
  );
}
