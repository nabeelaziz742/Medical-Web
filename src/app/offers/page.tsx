import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Special Offers & Deals",
  description: "View special offers and promotional deals on healthcare products at SAAD Medical Store, Lahore.",
};

export default function OffersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-600 text-xs font-semibold uppercase mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Promotions</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Special Offers & Deals</h1>
        <p className="text-sm text-slate-500 mt-1">Selected discounted healthcare essentials and seasonal deals</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-subtle">
        <Tag className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Current Promotional Campaign</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Promotional offers on selected medicines, multivitamins, and medical devices will be listed here with direct discount coupons.
        </p>
        <div className="mt-6">
          <Link href="/products">
            <Button variant="primary" size="md">
              Browse All Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
