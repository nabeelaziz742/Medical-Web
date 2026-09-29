"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus, Clock, CheckCircle2, AlertCircle, Eye, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STORE_INFO } from "@/lib/constants";
import { PopulatedPrescription } from "@/lib/prescriptions";

export default function AccountPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PopulatedPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        const res = await fetch("/api/prescriptions");
        if (!res.ok) {
          throw new Error("Failed to load prescriptions");
        }
        const data = await res.json();
        if (data.prescriptions) {
          setPrescriptions(data.prescriptions);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load prescriptions");
      } finally {
        setIsLoading(false);
      }
    }

    loadPrescriptions();
  }, []);

  const getStatusBadge = (status: PopulatedPrescription["status"]) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" size="sm">Approved</Badge>;
      case "COMPLETED":
        return <Badge variant="success" size="sm">Completed</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="default" size="sm">Under Review</Badge>;
      case "NEEDS_CLARIFICATION":
        return <Badge variant="warning" size="sm">Clarification Needed</Badge>;
      case "REJECTED":
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning" size="sm">Pending Review</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Prescriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">View submitted prescriptions and pharmacist review statuses</p>
        </div>
        <Link href="/prescription">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Upload New Prescription</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Prescriptions Uploaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not uploaded any doctor&apos;s prescriptions yet. When you submit a prescription, our team on RajGarh Road will review and prepare your medicines.
          </p>
          <div className="pt-2">
            <Link href="/prescription">
              <Button size="sm">Upload Doctor&apos;s Prescription</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-3 bg-slate-50/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-900 font-display">
                    Ref #{rx.prescriptionNumber}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Submitted on {new Date(rx.createdAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>{getStatusBadge(rx.status)}</div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">
                    Document: {rx.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Delivery: {rx.deliveryAddress || "Lahore"}
                  </p>
                </div>

                <Link href={`/account/prescriptions/${rx.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <span>View Status & Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <Truck className="h-5 w-5 text-blue-700 shrink-0" />
        <div>
          <span className="font-semibold text-slate-900">Prescription Processing & Delivery:</span>
          <p className="text-[11px] text-slate-500">
            Prescriptions are verified directly at our physical store on {STORE_INFO.address}. Home delivery is available across Lahore.
          </p>
        </div>
      </div>

    </div>
  );
}
