"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  FileText,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  prescriptionCount: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load customer list");
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white">Admin</Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">Customers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Registered Customers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View customer accounts, contact details, total orders placed, and prescription submissions ({totalCount} total).
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, email, phone..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading customer accounts...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-xs">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <Users className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                  <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                  <th className="py-3.5 px-4 font-semibold">Email Address</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Orders</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Prescriptions</th>
                  <th className="py-3.5 px-4 font-semibold">Total Spent</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {c.email || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {c.orderCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-cyan-400">
                      {c.prescriptionCount}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 font-[var(--font-heading)]">
                      Rs. {c.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({totalCount} accounts)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
