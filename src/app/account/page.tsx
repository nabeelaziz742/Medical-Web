"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  FileText, 
  Heart, 
  MapPin, 
  Phone, 
  ArrowRight, 
  User, 
  Truck, 
  AlertCircle 
} from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AccountOverviewPage() {
  const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="default" size="sm" className="bg-blue-600/30 border-blue-400/30 text-blue-200">
            Verified Customer
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Hello, {user?.name || "Valued Customer"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md">
            Welcome to your SAAD Medical Store portal. You can view order statuses, prescription reviews, and manage your delivery details.
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col gap-2">
          <Link href="/prescription">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 gap-1.5">
              <FileText className="h-4 w-4" />
              <span>Upload Rx</span>
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="sm" className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700">
              Shop Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">0</p>
            <Link href="/account/orders" className="text-[11px] font-semibold text-blue-700 hover:underline inline-flex items-center gap-1 mt-1">
              <span>View Orders</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Prescriptions</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">0</p>
            <Link href="/account/prescriptions" className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-1">
              <span>View Rx Status</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saved Wishlist</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">0</p>
            <Link href="/account/wishlist" className="text-[11px] font-semibold text-rose-700 hover:underline inline-flex items-center gap-1 mt-1">
              <span>View Items</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* Account Details & Store Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Personal Information</h3>
            <Link href="/account/profile" className="text-xs font-semibold text-blue-700 hover:underline">
              Edit
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Name</span>
              <span className="font-bold text-slate-800 text-sm">{user?.name || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Email Address</span>
              <span className="font-medium text-slate-800">{user?.email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Contact Phone</span>
              <span className="font-medium text-slate-800">{user?.phone || "—"}</span>
            </div>
          </div>
        </div>

        {/* Direct Store Support Card */}
        <div className="bg-blue-50/70 p-6 rounded-xl border border-blue-200 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-blue-200">
            <Phone className="h-5 w-5 text-blue-700" />
            <h3 className="font-bold text-sm text-slate-900">Direct Store Helpline</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Need assistance with your medicine order or doctor&apos;s prescription? Contact our RajGarh Road store in Lahore directly:
          </p>

          <div className="space-y-2 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Sharjeel:</span>
              <a href={`tel:${STORE_INFO.contacts[0].phone}`} className="font-bold text-blue-700 hover:underline">
                {STORE_INFO.contacts[0].formatted}
              </a>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Sameer:</span>
              <a href={`tel:${STORE_INFO.contacts[1].phone}`} className="font-bold text-blue-700 hover:underline">
                {STORE_INFO.contacts[1].formatted}
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
