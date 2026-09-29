"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  File,
  Loader2,
  ShieldCheck,
  MapPin,
  Phone,
  ArrowRight,
  Plus,
  Lock,
  Eye,
  Info,
} from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AddressItem {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  area?: string | null;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export function PrescriptionUploadView() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth State
  const [session, setSession] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newCity] = useState("Lahore");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Upload progress & result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submittedPrescription, setSubmittedPrescription] = useState<any | null>(null);

  // Check auth session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setSession(data.user);
            setCustomerName(data.user.name || "");
            setCustomerEmail(data.user.email || "");
            setCustomerPhone(data.user.phone || "");
            fetchAddresses();
          }
        }
      } catch (err) {
        console.warn("Auth check error:", err);
      } finally {
        setIsAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Fetch saved addresses
  async function fetchAddresses() {
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        if (data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: AddressItem) => a.isDefault) || data.addresses[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingNewAddress(true);
        }
      }
    } catch (err) {
      console.warn("Fetch addresses error:", err);
    }
  }

  // Handle file selection
  const handleFileChange = (selectedFile: File | null) => {
    setUploadError("");
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit. Please upload a smaller image or PDF.");
      return;
    }

    // Validate type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setUploadError("Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP prescription.");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Quick Login
  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: loginEmailOrPhone, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSession(data.user);
      setCustomerName(data.user.name || "");
      setCustomerEmail(data.user.email || "");
      setCustomerPhone(data.user.phone || "");
      await fetchAddresses();
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Quick Register
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          confirmPassword: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSession(data.user);
      setCustomerName(data.user.name || "");
      setCustomerEmail(data.user.email || "");
      setCustomerPhone(data.user.phone || "");
      setIsAddingNewAddress(true);
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Save new address inline
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    if (!newFullName.trim() || !newPhone.trim() || !newAddressLine1.trim()) {
      setAddressError("Please fill in full name, phone number, and street address.");
      return;
    }

    setIsSavingAddress(true);

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          phone: newPhone.trim(),
          addressLine1: newAddressLine1.trim(),
          addressLine2: newAddressLine2.trim() || undefined,
          area: newArea.trim() || undefined,
          city: newCity,
          isDefault: savedAddresses.length === 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save address");
      }

      if (data.address) {
        setSavedAddresses((prev) => [data.address, ...prev]);
        setSelectedAddressId(data.address.id);
        setIsAddingNewAddress(false);
        setNewAddressLine1("");
        setNewAddressLine2("");
        setNewArea("");
      }
    } catch (err: any) {
      setAddressError(err.message || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Get selected address text
  const getSelectedDeliveryAddressText = () => {
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return "";
    return `${addr.fullName} | ${addr.phone} — ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}${addr.area ? ", " + addr.area : ""}, ${addr.city}`;
  };

  // Handle Submit Prescription
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    if (!file) {
      setUploadError("Please upload a prescription document (PDF, JPG, PNG).");
      return;
    }

    const deliveryAddressText = getSelectedDeliveryAddressText();
    if (!deliveryAddressText) {
      setUploadError("Please select or add a delivery address in Lahore.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerName", customerName.trim() || session?.name || "");
      formData.append("customerPhone", customerPhone.trim() || session?.phone || "");
      formData.append("customerEmail", customerEmail.trim() || session?.email || "");
      formData.append("addressId", selectedAddressId || "");
      formData.append("deliveryAddress", deliveryAddressText);
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload prescription");
      }

      setSubmittedPrescription(data.prescription);
    } catch (err: any) {
      setUploadError(err.message || "Failed to submit prescription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading prescription portal...</p>
      </div>
    );
  }

  // 1. Success Confirmation View
  if (submittedPrescription) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Prescription Submitted Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Reference #{submittedPrescription.prescriptionNumber}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your prescription has been securely transmitted to our licensed pharmacy team on RajGarh Road, Lahore.
            </p>
          </div>

          {/* Details Summary Card */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-lg mx-auto text-left space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Status:</span>
              <Badge variant="warning" size="sm">Pending Pharmacist Review</Badge>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">File:</span>
              <span className="font-semibold text-slate-900">{submittedPrescription.fileName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-semibold text-slate-900 text-right max-w-xs truncate">
                {submittedPrescription.deliveryAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted:</span>
              <span className="font-semibold text-slate-900">
                {new Date(submittedPrescription.createdAt).toLocaleDateString("en-PK", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Next Steps Info */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 max-w-lg mx-auto text-left space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <Info className="h-4 w-4 text-blue-700" />
              <span>What happens next?</span>
            </div>
            <p className="text-slate-600">
              1. Our pharmacist reviews the prescription for accurate dosage and availability.
            </p>
            <p className="text-slate-600">
              2. You will receive a direct confirmation call or message on <strong>{submittedPrescription.customerPhone}</strong>.
            </p>
            <p className="text-slate-600">
              3. Medicines will be prepared and dispatched for home delivery across Lahore.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link href={`/account/prescriptions/${submittedPrescription.id}`}>
              <Button size="lg" className="gap-2 font-semibold">
                <span>Track Prescription Status</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/account/prescriptions">
              <Button variant="outline" size="lg">
                View All Prescriptions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated View: Render Auth Gateway
  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Sign In to Upload Prescription
            </h1>
            <p className="text-xs text-slate-500">
              Prescriptions are confidential medical documents linked securely to your verified customer account.
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === "login" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === "register" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === "login" ? (
            <form onSubmit={handleQuickLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email or Phone</label>
                <input
                  type="text"
                  required
                  value={loginEmailOrPhone}
                  onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                  placeholder="name@example.com or 03001234567"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-2.5 font-semibold text-sm"
              >
                {isSubmittingAuth ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign In & Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleQuickRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ahmad Khan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ahmad@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Lahore)</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-2.5 font-semibold text-sm"
              >
                {isSubmittingAuth ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Account & Continue"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 3. Authenticated Upload Form
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase">
          <FileText className="h-3.5 w-3.5" />
          <span>Licensed Pharmacy Service</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-slate-900 tracking-tight">
          Upload Your Prescription
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Upload a clear photo or PDF of your doctor&apos;s prescription. Our licensed pharmacy team on RajGarh Road will verify your order for home delivery across Lahore.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
        
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 1. Drag & Drop File Upload Area */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Prescription Document (Image or PDF) *
          </label>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-600 bg-blue-50/70"
                  : "border-slate-300 hover:border-blue-500 bg-slate-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <UploadCloud className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Click to browse or drag & drop prescription
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, JPG, PNG, WEBP (Max 10MB)
              </p>
              <div className="mt-4">
                <Button type="button" variant="primary" size="sm">
                  Select Prescription File
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {previewUrl ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
                    <img src={previewUrl} alt="Prescription preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <File className="h-6 w-6" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "Document"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Customer Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Muhammad Ali"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number (Lahore) *</label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* 3. Delivery Address Selection */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Delivery Address in Lahore *
            </label>
            {!isAddingNewAddress && (
              <button
                type="button"
                onClick={() => setIsAddingNewAddress(true)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {!isAddingNewAddress && savedAddresses.length > 0 && (
            <div className="space-y-2">
              {savedAddresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="prescription_address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 text-blue-600 focus:ring-blue-600"
                  />
                  <div className="text-xs flex-1">
                    <span className="font-semibold text-slate-900">{addr.fullName} ({addr.phone})</span>
                    <p className="text-slate-600 mt-0.5">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}{addr.area ? `, ${addr.area}` : ""}, {addr.city}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {isAddingNewAddress && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-700">Add Lahore Address</h4>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {addressError && (
                <p className="text-xs text-red-600">{addressError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Recipient Phone (03001234567)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <input
                type="text"
                placeholder="Street Address / House No."
                value={newAddressLine1}
                onChange={(e) => setNewAddressLine1(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Area / Sector (e.g. RajGarh / Gulberg)"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="text"
                  disabled
                  value="Lahore"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-100 text-slate-600"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveNewAddress}
                  disabled={isSavingAddress}
                  size="sm"
                >
                  {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Select Address"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Optional Additional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Additional Instructions / Preferred Quantities (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specify duration (e.g. 1 month supply), preferred brand variants, or specific dosage instructions..."
            className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || !file}
          size="lg"
          className="w-full font-bold gap-2 shadow-md shadow-blue-950/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Uploading Prescription...</span>
            </>
          ) : (
            <>
              <span>Submit Prescription for Pharmacy Review</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Store Verification Badge */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0" />
          <span>Verified Pharmacy on <strong>{STORE_INFO.address}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Phone className="h-3.5 w-3.5 text-blue-600" />
          <span>Sharjeel: {STORE_INFO.contacts[0].formatted}</span>
        </div>
      </div>

    </div>
  );
}
