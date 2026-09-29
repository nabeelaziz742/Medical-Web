import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TicketPercent,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Coins,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCouponById } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Coupon Detail (${id}) — SAAD Medical Store Admin`,
  };
}

export default async function CouponDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { id } = await params;
  const data = await getCouponById(id);

  if (!data) {
    notFound();
  }

  const { coupon, usages } = data;

  const totalDiscountGranted = usages.reduce((sum, u) => sum + u.discountAmount, 0);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Coupons</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xl sm:text-2xl font-bold text-blue-400">
              {coupon.code}
            </span>
            {coupon.status === "ACTIVE" ? (
              <Badge variant="success">Active</Badge>
            ) : coupon.status === "EXPIRED" ? (
              <Badge variant="danger">Expired</Badge>
            ) : coupon.status === "EXHAUSTED" ? (
              <Badge variant="warning">Exhausted</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Promotional discount rule created on {new Date(coupon.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/reports?tab=coupons">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-800 text-slate-200 text-xs gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Coupon Report</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Coupon Rules Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Discount Benefit</span>
          <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)]">
            {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `Rs. ${coupon.discountValue} OFF`}
          </p>
          <p className="text-[10px] text-slate-500">
            {coupon.maxDiscount ? `Capped at Rs. ${coupon.maxDiscount}` : "No max cap"}
          </p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Order Threshold</span>
          <p className="text-xl font-bold text-white font-[var(--font-heading)]">
            {coupon.minOrderValue ? `Rs. ${coupon.minOrderValue.toLocaleString()}` : "No Minimum"}
          </p>
          <p className="text-[10px] text-slate-500">Required cart subtotal</p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Uses</span>
          <p className="text-xl font-bold text-white font-[var(--font-heading)]">
            {coupon.usageCount}
            <span className="text-sm font-normal text-slate-500"> / {coupon.usageLimit ? coupon.usageLimit : "∞"}</span>
          </p>
          <p className="text-[10px] text-slate-500">Limit: {coupon.perCustomerLimit || 1} per customer</p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Discounts Given</span>
          <p className="text-xl font-bold text-emerald-400 font-[var(--font-heading)]">
            Rs. {totalDiscountGranted.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">Across {usages.length} customer orders</p>
        </div>
      </div>

      {/* Date Window Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-white">Active Validity Window:</span>
          <span className="text-slate-300">
            {new Date(coupon.validFrom).toLocaleDateString()} — {new Date(coupon.validTo).toLocaleDateString()}
          </span>
        </div>

        <div className="text-slate-400">
          Status calculation: <strong className="text-slate-200">{coupon.status}</strong>
        </div>
      </div>

      {/* Usage Ledger */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg space-y-3">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Coupon Redemption History
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {usages.length} {usages.length === 1 ? "Redemption" : "Redemptions"}
          </span>
        </div>

        {usages.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            This coupon has not been used on any customer orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Order Number</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 text-right font-semibold">Discount Applied</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usages.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                      {u.orderNumber || u.orderId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{u.customerName}</p>
                      <p className="text-[10px] text-slate-500">{u.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      Rs. {u.discountAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/orders/${u.orderId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          View Order
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
