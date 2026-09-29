"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New address form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [area, setArea] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/account/addresses");
      const data = await res.json();
      setAddresses(data.addresses || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city: "Lahore",
          area,
          isDefault,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add address");
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setFullName("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setArea("");
      setIsDefault(false);
      setIsAdding(false);
      setIsSubmitting(false);

      fetchAddresses();
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage delivery locations across Lahore</p>
        </div>

        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Address</span>
          </Button>
        )}
      </div>

      {/* Add Address Form Modal / Box */}
      {isAdding && (
        <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-700" />
              <span>Add New Lahore Delivery Address</span>
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddAddress} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Street Address / House No. / Building
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House #, Street #, Sector..."
                required
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. RajGarh, Gulberg, Model Town..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  value="Lahore"
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="defaultCheck"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-slate-300"
              />
              <label htmlFor="defaultCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                Set as default delivery address
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Save Address
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 && !isAdding ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Home className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Addresses Saved Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your Lahore home or office address for faster medicine checkout and doorstep delivery.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add Your First Address
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 relative ${
                addr.isDefault
                  ? "border-blue-500 bg-blue-50/20"
                  : "border-slate-200 bg-white shadow-subtle"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">{addr.fullName}</span>
                  {addr.isDefault && (
                    <Badge variant="success" size="sm">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {addr.area ? `${addr.area}, ` : ""}Lahore
                </p>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  Phone: {addr.phone}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Home Delivery Ready</span>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
