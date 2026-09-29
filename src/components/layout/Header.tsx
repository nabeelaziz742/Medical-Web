"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TopUtilityBar } from "./TopUtilityBar";
import { MainHeader } from "./MainHeader";
import { CategoryNav } from "./CategoryNav";
import { MobileDrawer } from "./MobileNav";

export function Header() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 34) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full flex flex-col relative z-40">
      {/* LEVEL 1 — Utility Bar (Scrolls away naturally) */}
      <TopUtilityBar />

      {/* LEVEL 2 & 3 — Sticky Header Container with backdrop blur & shadow on scroll */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-card border-slate-200/90"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <MainHeader
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          isScrolled={isScrolled}
        />
        <CategoryNav />
      </motion.div>

      {/* Mobile Drawer Navigation */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </header>
  );
}

