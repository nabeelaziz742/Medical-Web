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
  ArrowLeft,
  ShoppingBag,
  Plus,
  Loader2,
  Lock,
  Phone,
  AlertCircle,
  Building2,
  FileText,
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

  // Multi-step state: 1: Customer, 2: Address, 3: Delivery, 4: Payment, 5: Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Step 2: Delivery Address
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newCity, setNewCity] = useState("Lahore");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Step 3: Delivery Method
  const [deliveryMethod] = useState<"HOME_DELIVERY">("HOME_DELIVERY");

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "DIRECT_BANK_TRANSFER">("CASH_ON_DELIVERY");

  // Step 5: Notes & Order Submitting
  const [internalNotes, setInternalNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

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

  // Check auth session
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

  // Handle Quick Login
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
      await fetchAddresses();
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Quick Register
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
      setIsAddingNewAddress(true);
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Save New Address
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
          city: newCity.trim() || "Lahore",
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
        // Clear fields
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

  // Get selected delivery address string
  const getSelectedDeliveryAddressText = () => {
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return "";
    return `${addr.fullName} | ${addr.phone} — ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}${addr.area ? ", " + addr.area : ""}, ${addr.city}`;
  };

  // Handle Place Order
  const handlePlaceOrder = async () => {
    setOrderError("");
    const deliveryAddressText = getSelectedDeliveryAddressText();

    if (!deliveryAddressText) {
      setOrderError("Please select or add a delivery address.");
      setCurrentStep(2);
      return;
    }

    setIsPlacingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || session?.name,
          customerPhone: customerPhone.trim() || session?.phone,
          customerEmail: customerEmail.trim() || session?.email,
          shippingAddressId: selectedAddressId || undefined,
          deliveryAddress: deliveryAddressText,
          deliveryMethod: "HOME_DELIVERY",
          paymentMethod,
          internalNotes: internalNotes.trim() || undefined,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      if (data.order && data.order.id) {
        await refreshCart();
        router.push(`/orders/${data.order.id}`);
      }
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order. Please try again.");
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
          Please add products to your cart before proceeding to checkout.
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
              Your cart items are saved and ready for order placement
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

  // Stepper Header
  const steps = [
    { num: 1, title: "Customer Info", icon: User },
    { num: 2, title: "Delivery Address", icon: MapPin },
    { num: 3, title: "Delivery Method", icon: Truck },
    { num: 4, title: "Payment", icon: CreditCard },
    { num: 5, title: "Order Review", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Checkout Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Home delivery across Lahore from SAAD Medical Store, RajGarh Road
        </p>
      </div>

      {/* Checkout Progress Wizard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px]">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (isDone) setCurrentStep(step.num as any);
                  }}
                  disabled={!isDone && !isCurrent}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                    isCurrent
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : isDone
                      ? "text-emerald-700 hover:bg-slate-50 cursor-pointer"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span>{step.title}</span>
                </button>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > idx + 1 ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2-Column Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Active Step Interface */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: Customer Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Customer Information</h2>
                    <p className="text-xs text-slate-500">Contact details for delivery coordination</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Lahore)</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={() => {
                    if (customerName.trim() && customerPhone.trim()) {
                      setCurrentStep(2);
                    }
                  }}
                  disabled={!customerName.trim() || !customerPhone.trim()}
                  className="gap-2"
                >
                  <span>Continue to Delivery Address</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Delivery Address */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Delivery Address</h2>
                    <p className="text-xs text-slate-500">Select where your medicines should be delivered in Lahore</p>
                  </div>
                </div>

                {!isAddingNewAddress && (
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Saved Address Selection */}
              {!isAddingNewAddress && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "border-blue-600 bg-blue-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-blue-600 focus:ring-blue-600"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                          <span>{addr.fullName}</span>
                          <span className="text-slate-400 font-normal">|</span>
                          <span className="text-slate-600 font-normal">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          {addr.area ? `, ${addr.area}` : ""}
                        </p>
                        <p className="text-slate-500 font-medium mt-0.5">{addr.city}, Pakistan</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Add New Address Inline Form */}
              {isAddingNewAddress && (
                <form onSubmit={handleSaveNewAddress} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Add New Lahore Delivery Address
                    </h3>
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
                    <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="e.g. Ahmad Khan"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address / House No.</label>
                    <input
                      type="text"
                      required
                      value={newAddressLine1}
                      onChange={(e) => setNewAddressLine1(e.target.value)}
                      placeholder="e.g. House #14, Street #2"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Sector</label>
                      <input
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="e.g. RajGarh / Gulberg / DHA"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        disabled
                        value="Lahore"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isSavingAddress}
                      size="sm"
                    >
                      {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Use Address"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </Button>

                <Button
                  onClick={() => {
                    if (selectedAddressId) setCurrentStep(3);
                  }}
                  disabled={!selectedAddressId}
                  className="gap-2"
                >
                  <span>Continue to Delivery Method</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Delivery Method */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Delivery Method</h2>
                  <p className="text-xs text-slate-500">Verified Lahore pharmacy courier dispatch</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-xs">
                      <h3 className="text-sm font-bold text-slate-900">
                        {STORE_INFO.service} Across Lahore
                      </h3>
                      <p className="text-slate-600 mt-1">
                        Dispatched directly from our physical store located at <strong>{STORE_INFO.address}</strong>.
                      </p>
                      <p className="text-slate-500 mt-1">
                        Direct pharmacy hotline: <strong>{STORE_INFO.contacts[0].formatted}</strong>
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </Button>

                <Button onClick={() => setCurrentStep(4)} className="gap-2">
                  <span>Continue to Payment Method</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Method */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
                  <p className="text-xs text-slate-500">Choose your preferred payment method</p>
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
                    <p className="text-slate-600 mt-1">
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
                    <p className="text-slate-600 mt-1">
                      Transfer directly to our pharmacy account and share the receipt with Sharjeel ({STORE_INFO.contacts[0].formatted}).
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="md" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </Button>

                <Button onClick={() => setCurrentStep(5)} className="gap-2">
                  <span>Review Order</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Review & Placement */}
          {currentStep === 5 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Review & Confirm Order</h2>
                  <p className="text-xs text-slate-500">Verify your information before finalizing order</p>
                </div>
              </div>

              {orderError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Unable to place order:</strong>
                    <p className="mt-0.5">{orderError}</p>
                  </div>
                </div>
              )}

              {/* Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                    Customer
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{customerName}</p>
                  <p className="text-slate-600">{customerPhone}</p>
                  {customerEmail && <p className="text-slate-500">{customerEmail}</p>}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                    Delivery Address
                  </span>
                  <p className="font-semibold text-slate-800 line-clamp-2">
                    {getSelectedDeliveryAddressText()}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                    Delivery Method
                  </span>
                  <p className="font-bold text-slate-900">Home Delivery Across Lahore</p>
                  <p className="text-slate-500">From {STORE_INFO.address}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                    Payment Method
                  </span>
                  <p className="font-bold text-slate-900">
                    {paymentMethod === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Direct Bank Transfer"}
                  </p>
                  <p className="text-slate-500">Payment Status: Pending</p>
                </div>
              </div>

              {/* Internal Notes / Delivery Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Notes / Landmark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Near main gate, call before arrival..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(4)}
                  disabled={isPlacingOrder}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </Button>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold gap-2 shadow-lg shadow-emerald-950/20"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Place Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Sticky Order Summary */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-5">
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

            {/* Coupon Code Input */}
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

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                <span>Verified SAAD Medical Store Checkout</span>
              </div>
              <p className="text-slate-500">
                Orders are verified by licensed pharmacy staff and dispatched across Lahore.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
