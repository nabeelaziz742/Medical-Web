import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { CATEGORIES_NAV } from "@/lib/constants";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES_NAV.find((c) => c.slug === slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} | SAAD Medical Store`,
    description: `Shop genuine ${category.name} products with home delivery across Lahore from SAAD Medical Store.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES_NAV.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

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
