"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Grid, 
  FileText, 
  ShoppingBag, 
  User, 
  X, 
  MapPin, 
  Phone, 
  Truck,
  PlusCircle,
  ExternalLink
} from "lucide-react";
import { STORE_INFO, CATEGORIES_NAV } from "@/lib/constants";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold font-display text-sm tracking-tight text-white">SAAD Medical Store</h3>
                <p className="text-[10px] text-slate-400 font-normal">{STORE_INFO.tagline}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Service Notice */}
          <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-800">
            <Truck className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-medium">{STORE_INFO.service} Across Lahore</span>
          </div>

          {/* Prescription Button */}
          <div className="p-4 border-b border-slate-100">
            <Link
              href="/prescription"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <FileText className="h-4 w-4" />
              <span>Upload Prescription</span>
            </Link>
          </div>

          {/* Categories List */}
          <div className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Categories
            </h4>
            <div className="space-y-1">
              {CATEGORIES_NAV.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  onClick={onClose}
                  className="flex items-center justify-between py-2 px-2.5 rounded-md text-xs sm:text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors"
                >
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info with verified contact numbers */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span>{STORE_INFO.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Sharjeel: {STORE_INFO.contacts[0].formatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Sameer: {STORE_INFO.contacts[1].formatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCart } from "@/context/CartContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Categories", href: "/categories", icon: Grid },
    { label: "Prescription", href: "/prescription", icon: FileText },
    { label: "Cart", href: "/cart", icon: ShoppingBag, badge: itemCount },
    { label: "Account", href: "/account", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
                isActive ? "text-blue-700 font-semibold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-700 text-white text-[9px] font-bold h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
