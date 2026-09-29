import React, { Suspense } from "react";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Products Catalog | Medicines & Healthcare",
  description: "Browse verified medicines, supplements, medical devices, and personal care products available at SAAD Medical Store, Lahore.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Skeleton className="h-96" />
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CatalogView />
    </Suspense>
  );
}
