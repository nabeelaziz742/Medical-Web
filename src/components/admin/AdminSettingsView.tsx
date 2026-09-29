"use client";

import React, { useState } from "react";
import {
  Settings,
  Store,
  Truck,
  Boxes,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreSettings } from "@/lib/settings";

interface AdminSettingsViewProps {
  initialSettings: StoreSettings;
  adminName?: string;
}

export function AdminSettingsView({ initialSettings, adminName }: AdminSettingsViewProps) {
  // Store info
  const [storeName, setStoreName] = useState(initialSettings.storeName || "SAAD Medical Store");
  const [storePhone, setStorePhone] = useState(initialSettings.storePhone || "+92 300 1234567");
  const [storeEmail, setStoreEmail] = useState(initialSettings.storeEmail || "info@saadmedicalstore.com");
  const [storeAddress, setStoreAddress] = useState(initialSettings.storeAddress || "Shop #1, Near Main Gate, RajGarh Road, Lahore");
  const [storeLocation, setStoreLocation] = useState(initialSettings.storeLocation || "Lahore, Punjab, Pakistan");

  // Delivery
  const [deliveryFee, setDeliveryFee] = useState<number | string>(initialSettings.deliveryFee ?? 150);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | string>(initialSettings.freeDeliveryThreshold ?? 2000);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(initialSettings.isDeliveryEnabled ?? true);

  // Inventory & Expiry
  const [expiryThresholdDays, setExpiryThresholdDays] = useState<number | string>(initialSettings.expiryThresholdDays ?? 90);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(initialSettings.lowStockThreshold ?? 10);

  // Order
  const [minOrderValue, setMinOrderValue] = useState<number | string>(initialSettings.minOrderValue ?? 0);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setIsSaving(true);

    try {
      const payload = {
        storeName: storeName.trim(),
        storePhone: storePhone.trim(),
        storeEmail: storeEmail.trim(),
        storeAddress: storeAddress.trim(),
        storeLocation: storeLocation.trim(),
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        isDeliveryEnabled,
        expiryThresholdDays: Number(expiryThresholdDays),
        lowStockThreshold: Number(lowStockThreshold),
        minOrderValue: Number(minOrderValue),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSuccessMessage("Store settings and operational parameters saved successfully.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              STORE CONFIGURATION
            </span>
            <span className="text-xs text-slate-400">Single Admin Operational Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[var(--font-heading)]">
            Store Settings & Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage store identity, delivery rates, pharmacy expiry warning thresholds, and order constraints.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-blue-950/30 cursor-pointer"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save All Settings</span>
        </Button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: STORE IDENTITY & CONTACT */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <Store className="h-4 w-4 text-blue-400" />
            <span>Store Identity & Public Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Store Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Customer Support Email</label>
              <input
                type="email"
                required
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Operating City / Region</label>
              <input
                type="text"
                required
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Physical Pharmacy Address</label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DELIVERY CONFIGURATION */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <Truck className="h-4 w-4 text-emerald-400" />
            <span>Delivery Rates & Shipping Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Standard Delivery Fee (Rs.)</label>
              <input
                type="number"
                required
                min={0}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Charged on orders below the free delivery threshold.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Free Delivery Threshold (Rs.)</label>
              <input
                type="number"
                required
                min={0}
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Orders with subtotals meeting or exceeding this enjoy free delivery.</p>
            </div>

            <div className="sm:col-span-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeliveryEnabled}
                  onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-600 bg-slate-950 border-slate-700"
                />
                <span className="font-semibold text-slate-300">
                  Enable Home Delivery Service across Lahore
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: PHARMACY INVENTORY & EXPIRY CONFIGURATION */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <Calendar className="h-4 w-4 text-amber-400" />
            <span>Pharmacy Expiry & Stock Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Expiry Warning Threshold (Days)
              </label>
              <input
                type="number"
                required
                min={7}
                max={730}
                value={expiryThresholdDays}
                onChange={(e) => setExpiryThresholdDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Batches expiring within this number of days are tagged as <strong>EXPIRING_SOON</strong>. Default: 90 days.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Low-Stock Reorder Level (Default Units)
              </label>
              <input
                type="number"
                required
                min={1}
                max={1000}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Alerts on the Admin Dashboard when total product stock falls below this quantity.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: ORDER & CART RULES */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Order & Checkout Rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Minimum Order Value (Rs.)</label>
              <input
                type="number"
                min={0}
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Set to 0 to allow orders of any amount.</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-950/40 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save All Settings</span>
          </Button>
        </div>

      </form>
    </div>
  );
}
