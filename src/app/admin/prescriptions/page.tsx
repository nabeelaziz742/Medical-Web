"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Prescription {
  id: string;
  prescriptionNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  deliveryAddress: string | null;
  status: string;
  rejectionReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/prescriptions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load prescriptions");
      }
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [search, statusFilter, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return <Badge variant="success">{status}</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="default">Under Review</Badge>;
      case "NEEDS_CLARIFICATION":
        return <Badge variant="warning">Needs Clarification</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white">Admin</Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">Prescriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Prescription Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pharmacist review desk for customer doctor prescriptions ({totalCount} total submissions).
          </p>
        </div>

        <button
          onClick={fetchPrescriptions}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search Rx #, customer, phone..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading prescription queue...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-xs">{error}</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No prescriptions found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Rx Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Document File</th>
                  <th className="py-3.5 px-4 font-semibold">Review Status</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {rx.prescriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{rx.customerName}</p>
                      <p className="text-[11px] text-slate-400">{rx.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 truncate max-w-[160px]">
                      <p className="truncate font-medium">{rx.fileName}</p>
                      <p className="text-[10px] text-slate-500">{(rx.fileSize / 1024).toFixed(0)} KB</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(rx.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(rx.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/prescriptions/${rx.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30">
                          <span>Review Decision</span>
                        </Button>
                      </Link>
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
              Page {page} of {totalPages} ({totalCount} items)
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
