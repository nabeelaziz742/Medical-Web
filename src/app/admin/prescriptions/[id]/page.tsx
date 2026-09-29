"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  XCircle, 
  Save,
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PrescriptionDetail {
  id: string;
  prescriptionNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  deliveryAddress: string | null;
  notes: string | null;
  status: string;
  rejectionReason: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [modalType, setModalType] = useState<"CLARIFY" | "REJECT" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPrescription = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/prescriptions/${id}`);
      if (!res.ok) {
        throw new Error("Prescription not found or access denied");
      }
      const data = await res.json();
      setPrescription(data.prescription);
      setAdminNotes(data.prescription.adminNotes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load prescription detail");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const handleStatusTransition = async (newStatus: string, reason?: string) => {
    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      };

      if (reason) {
        payload.rejectionReason = reason.trim();
      }

      const res = await fetch(`/api/admin/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update review status");
      }

      setPrescription(data.prescription);
      setModalType(null);
      setReasonInput("");
      setSuccess(`Prescription review status changed to ${newStatus}`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!prescription) return;
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: prescription.status,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrescription(data.prescription);
      setSuccess("Internal pharmacist notes saved successfully");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save notes");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
        <Clock className="h-6 w-6 animate-spin text-cyan-500" />
        <span>Loading prescription details...</span>
      </div>
    );
  }

  if (error && !prescription) {
    return (
      <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-red-200">{error}</p>
        <Link href="/admin/prescriptions">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-200">
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/admin/prescriptions"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Review Queue</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {prescription.prescriptionNumber}
            </h1>
            <Badge variant="default" className="text-xs">
              {prescription.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Submitted on {new Date(prescription.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reason Modal for Clarification or Rejection */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {modalType === "CLARIFY" ? (
                <>
                  <HelpCircle className="h-5 w-5 text-amber-400" />
                  <span>Request Clarification / Replacement</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span>Reject Prescription</span>
                </>
              )}
            </h3>

            <p className="text-xs text-slate-300">
              {modalType === "CLARIFY"
                ? "Provide a clear message to the customer explaining what is missing (e.g. blurred signature, missing dosage, incomplete page)."
                : "Specify the legal/medical reason for rejecting this prescription document."}
            </p>

            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              rows={3}
              placeholder={modalType === "CLARIFY" ? "e.g. Doctor's stamp is unclear, please upload a clearer image..." : "e.g. Expired prescription or non-compliant format..."}
              required
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalType(null);
                  setReasonInput("");
                }}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isProcessing}
                onClick={() => handleStatusTransition(
                  modalType === "CLARIFY" ? "NEEDS_CLARIFICATION" : "REJECTED",
                  reasonInput
                )}
                className={modalType === "CLARIFY" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                Confirm {modalType === "CLARIFY" ? "Clarification Request" : "Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Review Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Document Preview & Customer Submission */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Document Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{prescription.fileName}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {prescription.fileType} • {(prescription.fileSize / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <a
                href={`/api/prescriptions/${prescription.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 shadow-md">
                  <Download className="h-4 w-4" />
                  <span>View / Download File</span>
                </Button>
              </a>
            </div>

            {/* If Image, Preview Safe Embed */}
            {prescription.fileType.startsWith("image/") && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 p-2 flex items-center justify-center min-h-[260px]">
                <img
                  src={`/api/prescriptions/${prescription.id}/file`}
                  alt="Doctor Prescription Preview"
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Customer Notes */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Customer Notes / Medication Request
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200">
                {prescription.notes || "No additional instructions provided by customer."}
              </div>
            </div>

            {/* Rejection / Clarification History if present */}
            {prescription.rejectionReason && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-200 space-y-1">
                <p className="font-bold">Pharmacist Message / Reason Provided:</p>
                <p className="leading-relaxed">{prescription.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>Customer Contact</span>
              </h3>
              <div className="text-xs text-slate-200 space-y-1">
                <p className="font-bold text-white">{prescription.customerName}</p>
                <p className="text-blue-400 font-mono">{prescription.customerPhone}</p>
                {prescription.customerEmail && (
                  <p className="text-slate-400">{prescription.customerEmail}</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Delivery Address</span>
              </h3>
              <div className="text-xs text-slate-200">
                <p className="leading-relaxed">{prescription.deliveryAddress || "Address provided during phone consultation."}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Decision Actions & Notes */}
        <div className="space-y-6">
          
          {/* Action Buttons */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Pharmacist Review Decisions</span>
            </h2>

            <div className="space-y-2.5">
              {prescription.status === "PENDING" && (
                <Button
                  onClick={() => handleStatusTransition("UNDER_REVIEW")}
                  isLoading={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10"
                >
                  Mark as Under Review
                </Button>
              )}

              {(prescription.status === "PENDING" || prescription.status === "UNDER_REVIEW") && (
                <>
                  <Button
                    onClick={() => handleStatusTransition("APPROVED")}
                    isLoading={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Prescription</span>
                  </Button>

                  <Button
                    onClick={() => setModalType("CLARIFY")}
                    variant="outline"
                    className="w-full border-amber-700 text-amber-300 hover:bg-amber-950/40 text-xs h-10 flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Request Clarification</span>
                  </Button>

                  <Button
                    onClick={() => setModalType("REJECT")}
                    variant="outline"
                    className="w-full border-red-800 text-red-400 hover:bg-red-950/40 text-xs h-10 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Prescription</span>
                  </Button>
                </>
              )}

              {prescription.status === "APPROVED" && (
                <Button
                  onClick={() => handleStatusTransition("COMPLETED")}
                  isLoading={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10"
                >
                  Mark as Completed (Dispensed)
                </Button>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Internal Admin Notes
            </h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Private notes on medicine availability, batch allotment, or doctor verification..."
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <Button
              onClick={handleSaveNotes}
              size="sm"
              isLoading={isProcessing}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Admin Notes</span>
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
