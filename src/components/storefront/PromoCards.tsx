import React from "react";
import Link from "next/link";
import { Truck, FileText, Sparkles, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function PromoCards() {
  const cards = [
    {
      id: "delivery",
      title: "Home Delivery",
      description: "Convenient delivery from SAAD Medical Store across Lahore",
      cta: "Order Now",
      href: "/products",
      icon: Truck,
      bgGradient: "from-blue-900 to-slate-900",
      accent: "bg-blue-600 text-white",
      badge: "Local Service",
    },
    {
      id: "prescription",
      title: "Upload Prescription",
      description: "Send your prescription for review by our store team",
      cta: "Upload Now",
      href: "/prescription",
      icon: FileText,
      bgGradient: "from-slate-900 to-blue-950",
      accent: "bg-emerald-600 text-white",
      badge: "Prescription Care",
    },
    {
      id: "offers",
      title: "Explore Offers",
      description: "Browse available offers and deals on healthcare essentials",
      cta: "View Offers",
      href: "/offers",
      icon: Sparkles,
      bgGradient: "from-slate-900 to-slate-900",
      accent: "bg-amber-600 text-white",
      badge: "Promotions",
    },
  ];

  return (
    <section className="relative py-14 sm:py-16 md:py-20 bg-gradient-to-b from-white via-blue-50/20 to-slate-50 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className={`relative rounded-2xl bg-gradient-to-br ${card.bgGradient} text-white p-6 sm:p-7 border border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group`}
                >
                  {/* Background accent glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accent} shadow-2xs group-hover:scale-105 transition-transform duration-200`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-display text-white tracking-tight group-hover:text-blue-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-2 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-white group-hover:text-blue-400 transition-colors"
                    >
                      <span>{card.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

