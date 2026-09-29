"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TicketPercent,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  Percent,
  Coins,
  Users,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";
  createdAt: string;
}

export function AdminCouponsView({ adminName }: { adminName?: string }) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formValue, setFormValue] = useState<number | string>(10);
  const [formMinOrder, setFormMinOrder] = useState<number | string>("");
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | string>("");
  const [formValidFrom, setFormValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [formValidTo, setFormValidTo] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formUsageLimit, setFormUsageLimit] = useState<number | string>("");
  const [formPerCustomer, setFormPerCustomer] = useState<number | string>(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        status: statusFilter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormType("PERCENTAGE");
    setFormValue(10);
    setFormMinOrder("");
    setFormMaxDiscount("");
    setFormValidFrom(new Date().toISOString().split("T")[0]);
    setFormValidTo(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormUsageLimit("");
    setFormPerCustomer(1);
    setFormIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.discountType);
    setFormValue(coupon.discountValue);
    setFormMinOrder(coupon.minOrderValue !== null ? coupon.minOrderValue : "");
    setFormMaxDiscount(coupon.maxDiscount !== null ? coupon.maxDiscount : "");
    setFormValidFrom(new Date(coupon.validFrom).toISOString().split("T")[0]);
    setFormValidTo(new Date(coupon.validTo).toISOString().split("T")[0]);
    setFormUsageLimit(coupon.usageLimit !== null ? coupon.usageLimit : "");
    setFormPerCustomer(coupon.perCustomerLimit !== null ? coupon.perCustomerLimit : 1);
    setFormIsActive(coupon.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formCode.trim()) {
      setFormError("Coupon code is required.");
      return;
    }
    const numVal = Number(formValue);
    if (isNaN(numVal) || numVal <= 0) {
      setFormError("Discount value must be a positive number.");
      return;
    }
    if (formType === "PERCENTAGE" && numVal > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        code: formCode.trim().toUpperCase(),
        discountType: formType,
        discountValue: numVal,
        minOrderValue: formMinOrder !== "" ? Number(formMinOrder) : null,
        maxDiscount: formMaxDiscount !== "" ? Number(formMaxDiscount) : null,
        validFrom: new Date(formValidFrom).toISOString(),
        validTo: new Date(formValidTo).toISOString(),
        usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : null,
        perCustomerLimit: formPerCustomer !== "" ? Number(formPerCustomer) : 1,
        isActive: formIsActive,
      };

      let res;
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save coupon");
      }

      setIsModalOpen(false);
      await fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete or deactivate coupon "${code}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCoupons();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (coupon: CouponItem) => {
    switch (coupon.status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "EXPIRED":
        return <Badge variant="danger">Expired</Badge>;
      case "EXHAUSTED":
        return <Badge variant="warning">Exhausted</Badge>;
      case "INACTIVE":
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              STORE PROMOTIONS
            </span>
            <span className="text-xs text-slate-400">Phase 9 Operational Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Coupon & Discount Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create promotional codes, enforce server-side discount limits, and track customer usage.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-blue-950/30 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Coupon</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "All Coupons", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Expired", value: "EXPIRED" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by code (e.g. WELCOME10)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading promotional coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <TicketPercent className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No coupons found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first promotional discount coupon for customer checkout.
            </p>
            <Button onClick={openCreateModal} size="sm" className="bg-blue-600 text-white mt-2">
              Create Coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Discount</th>
                  <th className="py-3 px-4 font-semibold">Min Order</th>
                  <th className="py-3 px-4 font-semibold">Max Cap</th>
                  <th className="py-3 px-4 font-semibold">Valid Window</th>
                  <th className="py-3 px-4 text-center font-semibold">Usage</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{c.code}</span>
                        <ExternalLink className="h-3 w-3 text-slate-500" />
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      {c.discountType === "PERCENTAGE" ? (
                        <span className="text-emerald-400 font-bold">{c.discountValue}% OFF</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">Rs. {c.discountValue} OFF</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {c.minOrderValue ? `Rs. ${c.minOrderValue.toLocaleString()}` : "None"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {c.maxDiscount ? `Rs. ${c.maxDiscount.toLocaleString()}` : "No Limit"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <p>{new Date(c.validFrom).toLocaleDateString()} to</p>
                      <p className="text-[10px] text-slate-500">{new Date(c.validTo).toLocaleDateString()}</p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-white">{c.usageCount}</span>
                      <span className="text-slate-500 font-normal">
                        {" "}
                        / {c.usageLimit ? c.usageLimit : "∞"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(c)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(c)}
                          className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === c.id}
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {coupons.length} of {totalCount} coupons
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="font-semibold text-white">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-bold text-white font-[var(--font-heading)]">
                  {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : "Create Promotional Coupon"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RAMADAN20"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Discount Value {formType === "PERCENTAGE" ? "(%)" : "(Rs.)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    max={formType === "PERCENTAGE" ? 100 : 100000}
                    step={formType === "PERCENTAGE" ? 1 : 10}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Min Order Amount (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="Optional (e.g. 1500)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Cap Amount (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="Optional (e.g. 500)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formValidTo}
                    onChange={(e) => setFormValidTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="Unlimited if empty"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={formPerCustomer}
                    onChange={(e) => setFormPerCustomer(e.target.value)}
                    placeholder="Default: 1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span className="font-semibold text-slate-300">Active and available for customer checkout</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCoupon ? "Save Changes" : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
