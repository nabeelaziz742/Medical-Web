"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Critical Application Error
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              SAAD Medical Store
            </h1>
            <p className="text-sm text-slate-600">
              An unexpected critical error occurred. Please refresh the page to continue.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => reset()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
