"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, Phone, MapPin, Truck } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "./HeroSearch";
import { HeroBackground } from "./HeroBackground";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative text-white pt-10 pb-16 md:pt-14 md:pb-20 lg:pt-16 lg:pb-22 overflow-hidden border-b border-slate-800/90">
      {/* 1. Animated Ambient Background Layer */}
      <HeroBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14 items-center">
          
          {/* Left Column (~55%): Headline, Copy, Search, CTAs, Service Info */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Eyebrow Pharmacy Label */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium backdrop-blur-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="tracking-wide">ESTABLISHED PHARMACY • LAHORE</span>
            </motion.div>

            {/* 2. Main Headline (Manrope 700 — White + Clean Blue Accent) */}
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12, ease: "easeOut" }}
              className="text-3xl sm:text-5xl lg:text-[54px] font-bold font-display tracking-tight text-white leading-[1.15]"
            >
              We take care <br />
              <span className="text-blue-400">
                of your health
              </span>
            </motion.h1>

            {/* 3. Supporting Text (Inter, Max 540px Width) */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="text-base sm:text-[17px] text-slate-300/90 max-w-[540px] leading-relaxed font-normal"
            >
              Medicines and daily healthcare products delivered directly from our RajGarh Road store in Lahore. Convenient home delivery available across Lahore.
            </motion.p>

            {/* 4. Unified Hero Search Box */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
              className="pt-1"
            >
              <HeroSearch />
            </motion.div>

            {/* 5. Clear CTA Hierarchy (Primary dominates) */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.36, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link href="/products">
                <Button
                  size="lg"
                  className="group gap-2 shadow-lg shadow-blue-950/50 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 border border-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200"
                >
                  <span>Shop Medicines</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/prescription">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-slate-800/80 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 text-slate-200 hover:text-white border border-slate-700/80 gap-2 font-medium text-sm px-5 py-3 rounded-xl transition-all duration-200"
                >
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span>Upload Prescription</span>
                </Button>
              </Link>
            </motion.div>

            {/* 6. Refined Service Information Row */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.44 }}
              className="pt-6 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-300"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Home Delivery</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Across Lahore</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Store Location</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{STORE_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Direct Support</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{STORE_INFO.contacts[0].formatted}</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column (~45%): Integrated Editorial Pharmacy Image & Store Information Panel */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            {/* Ambient Backlight Glow behind Image Composition */}
            <div className="absolute -inset-3 rounded-3xl bg-blue-600/15 blur-3xl animate-image-glow pointer-events-none" />

            {/* Unified Editorial Photographic Composition */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-900/90 shadow-2xl shadow-slate-950/70 group transition-all duration-300 hover:border-slate-600/80 backdrop-blur-xs">
              
              {/* Top: Pharmacy Setting Photograph */}
              <div className="relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-[16/11] w-full overflow-hidden bg-slate-950">
                <Image
                  src="/images/hero-pharmacy.jpg"
                  alt="SAAD Medical Store Pharmacy setting on RajGarh Road Lahore"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-102"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              </div>

              {/* Bottom: Refined Store Information Panel */}
              <div className="p-5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md space-y-3.5">
                
                {/* Store Header & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      Physical Store & Delivery
                    </span>
                    <h3 className="text-sm font-semibold text-white tracking-tight mt-0.5">
                      {STORE_INFO.address}
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Home Delivery</span>
                  </div>
                </div>

                {/* Direct Contact & Upload Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Sharjeel: {STORE_INFO.contacts[0].formatted}</span>
                  </div>
                  
                  <Link
                    href="/prescription"
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 ml-2 group/link transition-colors"
                  >
                    <span>Upload Prescription</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
