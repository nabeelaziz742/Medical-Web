import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POPULAR_PRODUCTS } from "@/data/seedProducts";
import { ProductCard } from "./ProductCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function PopularProducts() {
  return (
    <section className="py-14 sm:py-16 md:py-20 bg-slate-50/80 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Catalog</span>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold font-display text-slate-900 tracking-tight leading-tight mt-1">
                Popular Products
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-normal mt-1">
                Most trusted and commonly purchased products
              </p>
            </div>

            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 group"
            >
              <span>View All Products</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Product Cards Grid: 6 Items */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {POPULAR_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </ScrollReveal>

        {/* Mobile View All */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline group"
          >
            <span>View All Products</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}

