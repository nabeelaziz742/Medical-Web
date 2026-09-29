"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, ChevronDown, Sparkles } from "lucide-react";
import { CATEGORIES_NAV } from "@/lib/constants";

function CategoryNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const allCatRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (allCatRef.current && !allCatRef.current.contains(e.target as Node)) {
        setAllCategoriesOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const currentCategorySlug = searchParams.get("category");

  // Determine if a category link is active
  const isCategoryActive = (slug: string, href: string) => {
    if (pathname === href) return true;
    if (pathname === "/products" && currentCategorySlug === slug) return true;
    if (pathname === `/category/${slug}`) return true;
    return false;
  };

  const isOffersActive = pathname === "/offers";

  // Primary visible categories on wide screens vs compact screens
  const primaryCategories = CATEGORIES_NAV.slice(0, 7);
  const overflowCategories = CATEGORIES_NAV.slice(7);

  return (
    <nav className="bg-slate-50/90 border-t border-b border-slate-200/80 hidden md:block text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10.5">
          
          <div className="flex items-center space-x-1">
            {/* 1. All Categories Dropdown Button */}
            <div ref={allCatRef} className="relative py-1">
              <button
                type="button"
                onClick={() => {
                  setAllCategoriesOpen(!allCategoriesOpen);
                  setMoreDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer ${
                  allCategoriesOpen
                    ? "bg-blue-800 text-white"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
                aria-expanded={allCategoriesOpen}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>All Categories</span>
                <ChevronDown className={`h-3 w-3 opacity-80 transition-transform duration-150 ${allCategoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {/* All Categories Dropdown Menu */}
              {allCategoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Store Categories
                  </div>
                  <div className="py-1">
                    {CATEGORIES_NAV.map((cat) => {
                      const active = isCategoryActive(cat.slug, cat.href);
                      return (
                        <Link
                          key={cat.slug}
                          href={cat.href}
                          onClick={() => setAllCategoriesOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                            active
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-blue-700 font-medium"
                          }`}
                        >
                          <span>{cat.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1.5" />

            {/* 2. Main Visible Horizontal Category Links (Desktop Wide) */}
            <div className="flex items-center space-x-0.5">
              {/* Visible on 1280px+ */}
              <div className="hidden xl:flex items-center space-x-0.5">
                {CATEGORIES_NAV.map((cat) => {
                  const active = isCategoryActive(cat.slug, cat.href);
                  return (
                    <Link
                      key={cat.slug}
                      href={cat.href}
                      className={`px-2.5 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap ${
                        active
                          ? "text-blue-700 bg-white font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-blue-700 hover:bg-white/80 font-medium"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>

              {/* Compact range: 768px - 1279px (Shows first 7 + "More" dropdown to prevent wrap) */}
              <div className="flex xl:hidden items-center space-x-0.5">
                {primaryCategories.map((cat) => {
                  const active = isCategoryActive(cat.slug, cat.href);
                  return (
                    <Link
                      key={cat.slug}
                      href={cat.href}
                      className={`px-2 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap ${
                        active
                          ? "text-blue-700 bg-white font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-blue-700 hover:bg-white/80 font-medium"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}

                {/* More Dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreDropdownOpen(!moreDropdownOpen);
                      setAllCategoriesOpen(false);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      moreDropdownOpen
                        ? "bg-white text-blue-700 font-semibold shadow-2xs"
                        : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
                    }`}
                  >
                    <span>More</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>

                  {moreDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                      {overflowCategories.map((cat) => {
                        const active = isCategoryActive(cat.slug, cat.href);
                        return (
                          <Link
                            key={cat.slug}
                            href={cat.href}
                            onClick={() => setMoreDropdownOpen(false)}
                            className={`block px-3.5 py-2 text-xs transition-colors ${
                              active
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-700 hover:bg-slate-50 hover:text-blue-700 font-medium"
                            }`}
                          >
                            {cat.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 3. Offers & Deals Accent Link */}
          <div className="flex items-center pl-2">
            <Link
              href="/offers"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap ${
                isOffersActive
                  ? "bg-rose-100 text-rose-700 font-semibold"
                  : "text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 font-semibold"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
              <span>Offers & Deals</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}

export function CategoryNav() {
  return (
    <Suspense fallback={<div className="h-10.5 bg-slate-50 border-t border-b border-slate-200 hidden md:block" />}>
      <CategoryNavContent />
    </Suspense>
  );
}


