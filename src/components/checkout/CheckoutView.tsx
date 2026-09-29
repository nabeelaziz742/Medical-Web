"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Lock,
  Phone,
  AlertCircle,
  Building2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";

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

const COMMON_LAHORE_AREAS = [
  "Model Town",
  "Johar Town",
  "Gulberg",
  "DHA Phase 1-9",
  "Bahria Town",
  "Faisal Town",
  "Garden Town",
  "Allama Iqbal Town",
  "Samanabad",
  "RajGarh / Chauburji",
  "Wapda Town",
  "Township",
  "Canal View",
  "Cantt",
  "Shadman",
  "Cavalry Ground",
  "Gulshan-e-Ravi",
  "Valencia",
  "Lake City",
  "Askari",
];

export function CheckoutView() {
  const router = useRouter();
  const { items, itemCount, subtotal, deliveryFee, total, isLoading: isCartLoading, refreshCart } = useCart();

  // Auth state
  const [session, setSession] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Quick auth form states
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Delivery Information Form States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "DIRECT_BANK_TRANSFER">("CASH_ON_DELIVERY");

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);

  // Validation Errors
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryArea?: string;
  }>({});
  const [orderError, setOrderError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Apply Coupon Handler
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponFeedback(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.isValid) {
        throw new Error(data.error || "Invalid coupon code");
      }

      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
      });
      setCouponFeedback({
        type: "success",
        message: data.message || `Coupon "${data.code}" applied!`,
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: "error",
        message: err.message || "Failed to apply coupon",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFeedback(null);
  };

  // Check auth session on load
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
            fetchAddresses(data.user);
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

  // Fetch saved addresses and prefill default
  async function fetchAddresses(userObj?: UserProfile) {
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        if (data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: AddressItem) => a.isDefault) || data.addresses[0];
          applyAddressToForm(defaultAddr);
        }
      }
    } catch (err) {
      console.warn("Fetch addresses error:", err);
    }
  }

  const applyAddressToForm = (addr: AddressItem) => {
    setSelectedAddressId(addr.id);
    if (addr.fullName) setCustomerName(addr.fullName);
    if (addr.phone) setCustomerPhone(addr.phone);
    const fullStreet = addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : "");
    setDeliveryAddress(fullStreet);
    setDeliveryArea(addr.area || "");
    // Clear errors for auto-filled fields
    setFieldErrors({});
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
      await refreshCart();
      await fetchAddresses(data.user);
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
      await refreshCart();
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Validate form client-side
  const validateForm = () => {
    const errors: {
      customerName?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      deliveryArea?: string;
    } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = "Full Name is required (minimum 2 characters)";
    }

    const phoneClean = customerPhone.trim();
    const phoneRegex = /^(03[0-9]{9}|\+92[0-9]{10})$/;
    if (!phoneClean) {
      errors.customerPhone = "Mobile Number is required (e.g. 03001234567)";
    } else if (!phoneRegex.test(phoneClean)) {
      errors.customerPhone = "Please enter a valid Pakistani mobile number (e.g. 03001234567)";
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      errors.deliveryAddress = "Complete Delivery Address is required (house #, street #, landmark)";
    }

    if (!deliveryArea.trim() || deliveryArea.trim().length < 2) {
      errors.deliveryArea = "Area / Locality is required (e.g. Model Town, Johar Town)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");

    if (!validateForm()) {
      setOrderError("Please complete all required delivery fields highlighted below.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || session?.email || undefined,
        shippingAddressId: selectedAddressId || undefined,
        deliveryAddress: deliveryAddress.trim(),
        deliveryArea: deliveryArea.trim(),
        deliveryNotes: deliveryNotes.trim() || undefined,
        deliveryMethod: "HOME_DELIVERY",
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      if (data.order && (data.order.id || data.order.orderNumber)) {
        await refreshCart();
        const targetId = data.order.id || data.order.orderNumber;
        router.push(`/orders/${targetId}`);
      }
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order. Please check your information and try again.");
      setIsPlacingOrder(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Preparing checkout session...</p>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Your cart is empty</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Please add medicines or products to your cart before proceeding to checkout.
        </p>
        <Link href="/products">
          <Button size="lg" className="gap-2">
            <span>Browse Medicines</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // If user is NOT logged in: Render Auth Gateway
  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Sign In to Continue Checkout
            </h1>
            <p className="text-xs text-slate-500">
              Your cart items ({itemCount}) are saved and ready for order placement
            </p>
          </div>

          {/* Toggle Tabs */}
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
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

          <div className="pt-2 text-center">
            <Link href="/cart" className="text-xs text-blue-700 hover:underline">
              ← Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      
      {/* Checkout Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Home delivery across Lahore from SAAD Medical Store, RajGarh Road
        </p>
      </div>

      {/* Global Error Banner */}
      {orderError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <strong className="font-semibold block">Order Submission Notice</strong>
            <p className="mt-0.5">{orderError}</p>
          </div>
        </div>
      )}

      {/* 2-Column Checkout Layout */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Delivery Info & Options */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: Delivery Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  <MapPin className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Delivery Information</h2>
                  <p className="text-xs text-slate-500">Where should we deliver your medicine package?</p>
                </div>
              </div>

              {/* Quick Saved Address Selector if available */}
              {savedAddresses.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Fill:</span>
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applyAddressToForm(addr)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                        selectedAddressId === addr.id
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {addr.area || addr.fullName.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.customerName) {
                        setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
                      }
                    }}
                    placeholder="e.g. Muhammad Nabeel"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.customerName
                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />
                </div>
                {fieldErrors.customerName && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.customerName}</p>
                )}
              </div>

              {/* Mobile Number & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (fieldErrors.customerPhone) {
                          setFieldErrors((prev) => ({ ...prev, customerPhone: undefined }));
                        }
                      }}
                      placeholder="03001234567"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                        fieldErrors.customerPhone
                          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      }`}
                    />
                  </div>
                  {fieldErrors.customerPhone ? (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.customerPhone}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Rider will call this number for dispatch</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">For order invoice & receipts</p>
                </div>
              </div>

              {/* Complete Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (fieldErrors.deliveryAddress) {
                      setFieldErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                    }
                  }}
                  placeholder="House 123, Street 5, Block B, Model Town, Lahore"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    fieldErrors.deliveryAddress
                      ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  }`}
                />
                {fieldErrors.deliveryAddress && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.deliveryAddress}</p>
                )}
              </div>

              {/* Area / Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="lahore-areas"
                    value={deliveryArea}
                    onChange={(e) => {
                      setDeliveryArea(e.target.value);
                      if (fieldErrors.deliveryArea) {
                        setFieldErrors((prev) => ({ ...prev, deliveryArea: undefined }));
                      }
                    }}
                    placeholder="e.g. Model Town / Johar Town / DHA"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.deliveryArea
                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />
                  <datalist id="lahore-areas">
                    {COMMON_LAHORE_AREAS.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                  {fieldErrors.deliveryArea && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.deliveryArea}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    disabled
                    value="Lahore, Pakistan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Delivery Notes / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Notes / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Please call before delivery / Near main gate..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Delivery Method */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                <Truck className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delivery Method</h2>
                <p className="text-xs text-slate-500">Verified Lahore pharmacy courier dispatch</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/40 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <h3 className="text-sm font-bold text-slate-900">
                    Home Delivery Across Lahore
                  </h3>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Dispatched directly from SAAD Medical Store located at <strong>{STORE_INFO.address}</strong>.
                  </p>
                  <p className="text-slate-500 mt-1 font-medium">
                    Pharmacy Helpline: <span className="text-blue-700 font-bold">{STORE_INFO.contacts[0].formatted}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-blue-700">
                  {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                <CreditCard className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
                <p className="text-xs text-slate-500">Select how you would like to pay</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className="mt-1 text-blue-600 focus:ring-blue-600"
                />
                <div className="text-xs flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h3>
                  <p className="text-slate-600 mt-0.5">
                    Pay cash to the delivery rider upon receiving your package at your Lahore address.
                  </p>
                </div>
              </label>

              {/* Direct Bank Transfer */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === "DIRECT_BANK_TRANSFER"
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="DIRECT_BANK_TRANSFER"
                  checked={paymentMethod === "DIRECT_BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("DIRECT_BANK_TRANSFER")}
                  className="mt-1 text-blue-600 focus:ring-blue-600"
                />
                <div className="text-xs flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Direct Bank Transfer</h3>
                  <p className="text-slate-600 mt-0.5">
                    Transfer directly to pharmacy account and share receipt with Sharjeel ({STORE_INFO.contacts[0].formatted}).
                  </p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Sticky Order Summary & Submit */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold font-display text-slate-900">
                Order Summary
              </h2>
              <span className="text-xs font-semibold text-blue-700">
                {itemCount} {itemCount === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Items mini list */}
            <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {items.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 font-display shrink-0">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code / Coupon */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Promo Code / Coupon</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800">{appliedCoupon.code}</span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                      Applied
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    onClick={() => handleApplyCoupon()}
                    className="px-3 text-xs font-semibold"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}

              {couponFeedback && (
                <p
                  className={`text-[11px] ${
                    couponFeedback.type === "success" ? "text-emerald-700 font-medium" : "text-red-600"
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 font-display">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-semibold font-display">
                    - {formatPrice(appliedCoupon.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery (Lahore)</span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl font-display text-blue-700">
                  {formatPrice(
                    Math.max(0, subtotal + deliveryFee - (appliedCoupon?.discountAmount || 0))
                  )}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={isPlacingOrder}
              size="lg"
              className="w-full py-3.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Place Order</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                <span>Verified SAAD Medical Store Fulfillment</span>
              </div>
              <p className="text-slate-500">
                Delivery address and contact information are securely transmitted to our licensed pharmacy team.
              </p>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
