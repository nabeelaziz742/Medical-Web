"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Pill,
  Boxes,
  FileText,
  Users,
  FolderTree,
  Tag,
  TicketPercent,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { STORE_INFO } from "@/lib/constants";

interface AdminSidebarProps {
  onClose?: () => void;
  adminName?: string;
  adminEmail?: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Products", href: "/admin/products", icon: Pill },
  { label: "Prescriptions", href: "/admin/prescriptions", icon: FileText },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Brands", href: "/admin/brands", icon: Tag },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ onClose, adminName = "Store Admin", adminEmail = "admin@saadmedicalstore.com" }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
              SAAD MEDICAL
            </h2>
            <p className="text-[11px] font-medium text-blue-400">Admin Operations</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Store Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Storefront
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 text-slate-500" />
              <span>Live Storefront</span>
            </span>
          </Link>
        </div>
      </nav>

      {/* Admin Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{adminName}</p>
            <p className="text-[10px] text-slate-400 truncate">{adminEmail}</p>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded">
            OWNER
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
