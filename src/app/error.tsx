"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORE_INFO } from "@/lib/constants";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error message without exposing sensitive credentials
    console.error("Application runtime error:", error.message || "Unknown error");
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            System Notice
          </span>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 font-normal leading-relaxed">
            We encountered an issue processing your request. Please retry or return to our homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            size="md"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/">
            <Button variant="outline" size="md" className="gap-2 font-semibold border-slate-300">
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 font-medium">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            <span>Pharmacy Helpline: {STORE_INFO.contacts[0].formatted}</span>
          </div>
          <p className="text-[11px] text-slate-400">{STORE_INFO.address}, Lahore</p>
        </div>
      </div>
    </div>
  );
}
