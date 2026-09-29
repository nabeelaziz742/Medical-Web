"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function AccountWishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/wishlist")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Saved Wishlist</h2>
          <p className="text-xs text-slate-500 mt-0.5">Healthcare items and medicines saved for later</p>
        </div>
        <Link href="/products">
          <Button size="sm" variant="outline">Browse Catalog</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can save medicines, vitamins, and medical devices to your wishlist by clicking the heart icon on any product card.
          </p>
          <div className="pt-2">
            <Link href="/products">
              <Button size="sm">Explore Products</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.product?.brand?.name || "Product"}
                </span>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                  <Link href={`/products/${item.product?.slug}`} className="hover:text-blue-700">
                    {item.product?.name}
                  </Link>
                </h4>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {formatPrice(item.product?.price)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <Link href={`/products/${item.product?.slug}`} className="flex-1">
                  <Button size="sm" className="w-full text-xs">
                    View
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(item.productId)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 cursor-pointer"
                  title="Remove from wishlist"
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
