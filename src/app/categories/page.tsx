import React from "react";
import Link from "next/link";
import { PlusCircle, ArrowRight } from "lucide-react";
import { CATEGORIES_NAV } from "@/lib/constants";

export const metadata = {
  title: "Categories",
  description: "Browse all healthcare and medicine categories available at SAAD Medical Store, Lahore.",
};

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">All Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Explore our range of medicines, daily healthcare, and medical essentials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {CATEGORIES_NAV.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="group p-6 bg-white rounded-xl border border-slate-200 shadow-subtle hover:border-blue-500 hover:shadow-card transition-all flex flex-col justify-between h-44"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <PlusCircle className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                Browse
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                {cat.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>View products</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
