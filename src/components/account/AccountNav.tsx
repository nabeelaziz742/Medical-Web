"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  Package, 
  FileText, 
  Heart, 
  MapPin, 
  Settings, 
  LogOut, 
  Loader2 
} from "lucide-react";

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { label: "Overview", href: "/account", icon: User },
    { label: "My Orders", href: "/account/orders", icon: Package },
    { label: "Prescriptions", href: "/account/prescriptions", icon: FileText },
    { label: "Wishlist", href: "/account/wishlist", icon: Heart },
    { label: "Saved Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Profile Settings", href: "/account/profile", icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          ) : (
            <LogOut className="h-4 w-4 text-red-500" />
          )}
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
