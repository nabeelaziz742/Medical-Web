"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

const POPULAR_SEARCHES = ["Panadol", "Vitamin C", "Calcium-D", "Ensure"] as const;

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleQuickSelect = (term: string) => {
    setQuery(term);
    setIsLoading(true);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="w-full max-w-[580px]">
      {/* Unified Search Control Container */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center group"
      >
        {/* Leading Search Icon */}
        <div className="absolute left-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>

        {/* Search Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines, e.g. Panadol, Vitamin D, etc."
          className="w-full h-13 pl-12 pr-28 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-[15px] border border-slate-200/90 shadow-lg shadow-slate-950/20 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15 transition-all"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-24 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            aria-label="Clear search input"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Unified Search Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-60"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Refined Quick Search Suggestions */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap text-xs text-slate-400">
        <span className="text-slate-400 font-medium mr-0.5">Popular:</span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleQuickSelect(term)}
            className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-blue-950/80 text-slate-300 hover:text-white border border-slate-700/60 hover:border-blue-500/40 text-xs font-normal transition-all duration-150 cursor-pointer shadow-2xs"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
