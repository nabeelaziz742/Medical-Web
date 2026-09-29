import React from "react";
import Link from "next/link";
import { PlusCircle, MapPin, Phone, Clock, Truck, ShieldCheck } from "lucide-react";
import { STORE_INFO, CATEGORIES_NAV } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800 overflow-hidden">
      {/* Subtle Dark-Blue Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-[450px] sm:w-[600px] h-[260px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Feature Highlights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold font-display text-white">Home Delivery</h4>
              <p className="text-xs text-slate-400 font-normal">Available across Lahore for your convenience</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold font-display text-white">Local Physical Store</h4>
              <p className="text-xs text-slate-400 font-normal">RajGarh Road, Lahore</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold font-display text-white">Direct Phone Support</h4>
              <p className="text-xs text-slate-400 font-normal">Speak directly with our pharmacy staff</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold font-display text-white tracking-tight">SAAD </span>
                <span className="text-xs font-medium text-slate-300 uppercase">Medical Store</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">
              {STORE_INFO.tagline}. Providing pharmaceutical and healthcare products directly from our RajGarh Road store in Lahore.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-2 font-normal">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{STORE_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{STORE_INFO.timing}</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-semibold font-display text-white uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              {CATEGORIES_NAV.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={cat.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold font-display text-white uppercase tracking-wider mb-4">
              Customer Portal
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              <li>
                <Link href="/prescription" className="text-slate-400 hover:text-white transition-colors">
                  Upload Prescription
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="text-slate-400 hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-slate-400 hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-slate-400 hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-slate-500 hover:text-slate-400 transition-colors">
                  Store Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold font-display text-white uppercase tracking-wider mb-4">
              Contact Store
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <p className="text-slate-400 text-[11px] font-normal mb-1">Store In-Charge / Orders:</p>
                <a
                  href={`tel:${STORE_INFO.contacts[0].phone}`}
                  className="font-semibold text-blue-400 hover:text-blue-300 block text-sm"
                >
                  Sharjeel: {STORE_INFO.contacts[0].formatted}
                </a>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <p className="text-slate-400 text-[11px] font-normal mb-1">Inquiries & Support:</p>
                <a
                  href={`tel:${STORE_INFO.contacts[1].phone}`}
                  className="font-semibold text-blue-400 hover:text-blue-300 block text-sm"
                >
                  Sameer: {STORE_INFO.contacts[1].formatted}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 mt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SAAD Medical Store. All rights reserved.</p>
          <p className="text-slate-500">RajGarh Road, Lahore • Home Delivery Available</p>
        </div>

      </div>
    </footer>
  );
}
