import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Phone, MapPin } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function CtaSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-950 via-slate-900 via-blue-950 to-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* 1. Base Animated Gradient Shift */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 via-slate-900 to-slate-950 animate-hero-gradient opacity-90 pointer-events-none" />

      {/* 2. Soft Ambient Blue Glow Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[540px] h-[240px] sm:h-[320px] bg-blue-600/20 rounded-full blur-[90px] sm:blur-[120px] animate-cta-glow pointer-events-none" />

      {/* 3. Subtle Medical Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:28px_28px] opacity-12 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        
        <ScrollReveal>
          <div className="space-y-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/50">
              SAAD Medical Store — Lahore
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-white max-w-2xl mx-auto leading-tight">
              Need your medicines delivered?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
              Order directly from our catalog or upload your doctor&apos;s prescription for quick review and delivery from our RajGarh Road store in Lahore.
            </p>
          </div>
        </ScrollReveal>

        {/* Action Buttons */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/products">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 gap-2 shadow-lg shadow-blue-900/50 font-semibold text-sm hover:-translate-y-0.5 transition-all duration-200 group">
                <span>Shop Medicines</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>

            <Link href="/prescription">
              <Button
                variant="outline"
                size="lg"
                className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700 gap-2 font-semibold text-sm hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <FileText className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                <span>Upload Prescription</span>
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Contact Strip */}
        <ScrollReveal delay={0.2}>
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-normal">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              <span>{STORE_INFO.address}</span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              <a href={`tel:${STORE_INFO.contacts[0].phone}`} className="hover:text-blue-300 transition-colors">
                Sharjeel: {STORE_INFO.contacts[0].formatted}
              </a>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              <a href={`tel:${STORE_INFO.contacts[1].phone}`} className="hover:text-blue-300 transition-colors">
                Sameer: {STORE_INFO.contacts[1].formatted}
              </a>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}

