import React from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { STORE_INFO } from "@/lib/constants";
import { MapPin, Phone, Truck } from "lucide-react";

export const metadata = {
  title: "Customer Account Portal | SAAD Medical Store",
  description: "Manage your SAAD Medical Store account, orders, prescriptions, and saved addresses.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Page Title & Breadcrumb */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, active prescriptions, orders, and delivery addresses
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
          <Truck className="h-4 w-4 text-emerald-600" />
          <span>{STORE_INFO.service} Across Lahore</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AccountNav />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>

    </div>
  );
}
