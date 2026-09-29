"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone.trim() || !password) {
      setError("Please fill in both admin email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password, rememberMe: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Admin authentication failed.");
        setIsLoading(false);
        return;
      }

      if (data.user?.role !== "ADMIN") {
        setError("Access restricted. Store Admin credentials required.");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-white backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mx-auto shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Store Admin Portal</h1>
          <p className="text-xs text-slate-400">
            SAAD Medical Store Management & Operations
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-900/40 border border-red-700 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email / Username
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="admin@saadmedicalstore.com"
                required
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-600 bg-slate-700/60 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-slate-600 bg-slate-700/60 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-300 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md mt-2"
          >
            Access Admin Dashboard
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700 text-center text-xs text-slate-400">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Storefront</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
