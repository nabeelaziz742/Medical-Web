"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, User, PlusCircle, Menu, FileText } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { LiveSearchBar } from "@/components/search/LiveSearchBar";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface MainHeaderProps {
  onOpenMobileMenu?: () => void;
  isScrolled?: boolean;
}

export function MainHeader({ onOpenMobileMenu, isScrolled = false }: MainHeaderProps) {
  const { itemCount, subtotal, openDrawer } = useCart();

  return (
    <div className={`w-full transition-all duration-200 ${isScrolled ? "py-2.5 sm:py-3" : "py-3.5 sm:py-4"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group select-none">
              <div className="w-9.5 h-9.5 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-800 transition-colors">
                <PlusCircle className="h-5.5 w-5.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-blue-700 font-display">
                    SAAD
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium tracking-normal text-slate-800 uppercase">
                    Medical Store
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-normal text-slate-500 -mt-0.5 tracking-normal">
                  {STORE_INFO.tagline}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center Live Search Bar (Takes majority middle width) */}
          <div className="hidden md:flex flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-2 lg:mx-4">
            <LiveSearchBar />
          </div>

          {/* 3. Actions Sequence: [RX] -> [WISHLIST] -> [CART] -> [ACCOUNT] */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            
            {/* Upload Prescription Button */}
            <Link
              href="/prescription"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Upload Prescription</span>
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/account/wishlist"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-blue-700 transition-colors"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart Icon & Amount */}
            <button
              onClick={openDrawer}
              className="flex items-center gap-2 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-800 hover:bg-slate-100 hover:text-blue-700 transition-all cursor-pointer"
              title="Shopping Cart"
              aria-label={`Shopping Cart, ${itemCount} items`}
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-700 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-scale-check">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs leading-none">
                <span className="text-[10px] text-slate-400 font-normal">Cart</span>
                <span className="font-semibold text-slate-900 mt-0.5 font-display text-[11px]">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </button>

            {/* Account / Profile Shortcut */}
            <Link
              href="/account"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700 transition-colors"
              title="Account"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline font-semibold">Account</span>
            </Link>
          </div>

        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-3 md:hidden">
          <LiveSearchBar isMobile />
        </div>

      </div>
    </div>
  );
}

