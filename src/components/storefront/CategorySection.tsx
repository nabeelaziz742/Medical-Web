import React from "react";
import Link from "next/link";
import { 
  Pill, 
  Sparkles, 
  HeartHandshake, 
  Baby, 
  ShieldCheck, 
  Sparkle, 
  Smile, 
  Stethoscope, 
  Cross, 
  Activity,
  ArrowRight
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const CATEGORIES_WITH_ICONS = [
  { name: "Medicines", slug: "medicines", count: "Prescription & OTC", icon: Pill, color: "text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white" },
  { name: "Vitamins & Supplements", slug: "vitamins-supplements", count: "Daily Health", icon: Sparkles, color: "text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white" },
  { name: "Personal Care", slug: "personal-care", count: "Hygiene & Care", icon: HeartHandshake, color: "text-sky-600 bg-sky-50 group-hover:bg-sky-600 group-hover:text-white" },
  { name: "Baby Care", slug: "baby-care", count: "Infant Care", icon: Baby, color: "text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white" },
  { name: "Skin Care", slug: "skin-care", count: "Derma & Lotions", icon: Sparkle, color: "text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white" },
  { name: "Hair Care", slug: "hair-care", count: "Oils & Shampoos", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white" },
  { name: "Oral Care", slug: "oral-care", count: "Dental Health", icon: Smile, color: "text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white" },
  { name: "Medical Devices", slug: "medical-devices", count: "Monitors & Strips", icon: Stethoscope, color: "text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white" },
  { name: "First Aid", slug: "first-aid", count: "Bandages & Sprays", icon: Cross, color: "text-red-600 bg-red-50 group-hover:bg-red-600 group-hover:text-white" },
  { name: "Health & Wellness", slug: "health-wellness", count: "Nutrition & Tonics", icon: Activity, color: "text-blue-700 bg-blue-50 group-hover:bg-blue-700 group-hover:text-white" },
] as const;

export function CategorySection() {
  return (
    <section className="relative py-14 sm:py-16 md:py-20 bg-slate-50 border-b border-slate-200 overflow-hidden">
      {/* Subtle faint ambient dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Categories</span>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold font-display text-slate-900 tracking-tight leading-tight mt-1">
                Shop by Category
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-normal mt-1">
                Explore medicines and healthcare products
              </p>
            </div>

            <Link
              href="/categories"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 group"
            >
              <span>Browse All Categories</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Categories Grid: 10 Items */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
            {CATEGORIES_WITH_ICONS.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-subtle hover:border-blue-400 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center justify-between min-h-[145px]"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${cat.color} mb-3 shadow-2xs`}>
                    <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-105" />
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                      {cat.count}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
          >
            <span>Browse All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}

