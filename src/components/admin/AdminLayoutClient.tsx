"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, X, Shield, MapPin, Phone } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminName?: string;
  adminEmail?: string;
}

export function AdminLayoutClient({ children, adminName, adminEmail }: AdminLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <AdminSidebar adminName={adminName} adminEmail={adminEmail} />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-50 w-64 bg-slate-900 h-full flex flex-col shadow-2xl">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar
              onClose={() => setIsMobileOpen(false)}
              adminName={adminName}
              adminEmail={adminEmail}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              <span>{STORE_INFO.address}</span>
              <span className="text-slate-600">•</span>
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              <span>Sharjeel: 0336 4085027</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[11px]">System Online</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
