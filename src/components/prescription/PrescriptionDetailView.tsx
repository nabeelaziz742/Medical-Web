"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  ArrowLeft,
  Download,
  Eye,
  UploadCloud,
  File,
  Loader2,
  ShieldCheck,
  Building2,
  Check,
} from "lucide-react";
import { PopulatedPrescription } from "@/lib/prescriptions";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PrescriptionDetailViewProps {
  prescriptionId: string;
}

export function PrescriptionDetailView({ prescriptionId }: PrescriptionDetailViewProps) {
  const [prescription, setPrescription] = useState<PopulatedPrescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replacement upload state (if NEEDS_CLARIFICATION)
  const [isReplacing, setIsReplacing] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false);
  const [replacementError, setReplacementError] = useState("");
  const [replacementSuccess, setReplacementSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPrescription() {
      try {
        const res = await fetch(`/api/prescriptions/${encodeURIComponent(prescriptionId)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load prescription");
        }

        setPrescription(data.prescription);
      } catch (err: any) {
        setError(err.message || "Could not retrieve prescription details");
      } finally {
        setIsLoading(false);
      }
    }

    if (prescriptionId) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const handleReplacementUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplacementError("");
    if (!replacementFile) {
      setReplacementError("Please select a replacement file.");
      return;
    }

    setIsUploadingReplacement(true);

    try {
      const formData = new FormData();
      formData.append("file", replacementFile);

      const res = await fetch(`/api/prescriptions/${encodeURIComponent(prescriptionId)}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload replacement file");
      }

      setPrescription(data.prescription);
      setReplacementSuccess(true);
      setIsReplacing(false);
      setReplacementFile(null);
    } catch (err: any) {
      setReplacementError(err.message || "Failed to upload replacement file");
    } finally {
      setIsUploadingReplacement(false);
    }
  };

  const getStatusBadge = (status: PopulatedPrescription["status"]) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" size="md">Approved by Pharmacist</Badge>;
      case "COMPLETED":
        return <Badge variant="success" size="md">Completed & Dispatched</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="default" size="md">Under Pharmacist Review</Badge>;
      case "NEEDS_CLARIFICATION":
        return <Badge variant="warning" size="md">Clarification Needed</Badge>;
      case "REJECTED":
        return <Badge variant="danger" size="md">Prescription Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning" size="md">Pending Review</Badge>;
    }
  };

  const timelineSteps = [
    { key: "PENDING", label: "Submitted", desc: "Received at pharmacy" },
    { key: "UNDER_REVIEW", label: "Under Review", desc: "Verified by licensed pharmacist" },
    {
      key: "DECISION",
      label: prescription?.status === "REJECTED" ? "Rejected" : prescription?.status === "NEEDS_CLARIFICATION" ? "Clarification" : "Approved",
      desc: prescription?.status === "REJECTED" ? "Verification failed" : prescription?.status === "NEEDS_CLARIFICATION" ? "Information requested" : "Dosage verified",
    },
    { key: "COMPLETED", label: "Completed", desc: "Order dispatched" },
  ];

  const getTimelineStepIndex = (status: PopulatedPrescription["status"]) => {
    switch (status) {
      case "COMPLETED": return 3;
      case "APPROVED":
      case "NEEDS_CLARIFICATION":
      case "REJECTED": return 2;
      case "UNDER_REVIEW": return 1;
      case "PENDING":
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading prescription details...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-subtle">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Prescription Not Accessible</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {error || "Could not locate this prescription. Please ensure you are logged into the correct account."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/account/prescriptions">
              <Button size="md">View My Prescriptions</Button>
            </Link>
            <Link href="/prescription">
              <Button variant="outline" size="md">Upload New</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIdx = getTimelineStepIndex(prescription.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/prescriptions"
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Prescriptions</span>
        </Link>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Prescription Submission
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
                Ref #{prescription.prescriptionNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(prescription.createdAt).toLocaleDateString("en-PK", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div>{getStatusBadge(prescription.status)}</div>
        </div>

        {/* 4-Step Interactive Timeline */}
        <div className="pt-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Prescription Verification Process
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {timelineSteps.map((st, idx) => {
              const isDone = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              const isRejected = idx === 2 && prescription.status === "REJECTED";
              const isClarification = idx === 2 && prescription.status === "NEEDS_CLARIFICATION";

              return (
                <div key={st.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isRejected
                          ? "bg-red-600 text-white"
                          : isClarification
                          ? "bg-amber-500 text-white"
                          : isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs"
                          : isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isRejected ? <XCircle className="h-4 w-4" /> : isDone ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isDone ? "text-slate-900" : "text-slate-400"}`}>
                      {st.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clarification Alert Banner */}
      {prescription.status === "NEEDS_CLARIFICATION" && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-900">
                Pharmacist Clarification Request
              </h3>
              <p className="text-amber-800 leading-relaxed">
                {prescription.rejectionReason || "Please upload a clearer image of your prescription showing doctor stamp and dosage."}
              </p>
            </div>
          </div>

          {!isReplacing ? (
            <div className="pt-2 pl-8">
              <Button
                onClick={() => setIsReplacing(true)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
              >
                Upload Replacement Prescription
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReplacementUpload} className="pl-8 pt-2 space-y-3 max-w-lg">
              {replacementError && <p className="text-red-700">{replacementError}</p>}
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setReplacementFile(e.target.files?.[0] || null)}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-800"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isUploadingReplacement || !replacementFile}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                >
                  {isUploadingReplacement ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Replacement"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setIsReplacing(false); setReplacementFile(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Rejection Alert Banner */}
      {prescription.status === "REJECTED" && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-red-900">Prescription Could Not Be Verified</h3>
            <p className="text-red-800 leading-relaxed">
              Reason: {prescription.rejectionReason || "Prescription is expired or unreadable."}
            </p>
            <p className="text-slate-600 pt-1">
              For assistance, please contact our pharmacy hotline directly on <strong>{STORE_INFO.contacts[0].formatted}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Prescription Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <h2 className="text-base font-bold font-display text-slate-900 pb-2 border-b border-slate-100">
          Prescription Document
        </h2>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <File className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{prescription.fileName}</h3>
              <p className="text-xs text-slate-500">
                {(prescription.fileSize / (1024 * 1024)).toFixed(2)} MB • {prescription.fileType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/prescriptions/${prescription.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
                <span>View Secure Document</span>
              </Button>
            </a>

            <a
              href={`/api/prescriptions/${prescription.id}/file?download=true`}
              download={prescription.fileName}
            >
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Information Snapshot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4 text-xs">
        <h2 className="text-base font-bold font-display text-slate-900 pb-2 border-b border-slate-100">
          Delivery & Notes Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Patient / Recipient</span>
            <p className="font-bold text-slate-900 text-sm">{prescription.customerName}</p>
            <p className="text-slate-600">{prescription.customerPhone}</p>
            {prescription.customerEmail && <p className="text-slate-500">{prescription.customerEmail}</p>}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Delivery Destination (Lahore)</span>
            <p className="font-semibold text-slate-800 leading-relaxed">
              {prescription.deliveryAddress || "Address provided during confirmation"}
            </p>
          </div>
        </div>

        {prescription.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Instructions / Preferred Quantities</span>
            <p className="text-slate-700">{prescription.notes}</p>
          </div>
        )}
      </div>

      {/* Pharmacy Verification & Support Banner */}
      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
          <Phone className="h-4 w-4 text-blue-700" />
          <span>Direct Pharmacy Support</span>
        </div>
        <p className="text-slate-600">
          Prescriptions are verified directly at SAAD Medical Store, {STORE_INFO.address}. Need immediate help with your prescription?
        </p>
        <p className="font-semibold text-slate-800">
          • Call Sharjeel: <span className="text-blue-700">{STORE_INFO.contacts[0].formatted}</span>
        </p>
      </div>

    </div>
  );
}
