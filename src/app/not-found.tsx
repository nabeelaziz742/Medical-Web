import React from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
          <PlusCircle className="h-8 w-8" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">404 Error</span>
          <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight mt-1">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-2 leading-relaxed">
            The healthcare product, medicine, or page you were looking for could not be found.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button size="md" className="gap-2 font-semibold">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="md" className="font-semibold">
              <span>Browse Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
