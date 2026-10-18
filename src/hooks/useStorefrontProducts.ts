"use client";

import { useEffect, useState } from "react";
import { ProductDetail } from "@/data/products";

let cachedRequest: Promise<ProductDetail[]> | null = null;

function fetchProducts(): Promise<ProductDetail[]> {
  if (!cachedRequest) {
    cachedRequest = fetch("/api/products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load products"))))
      .then((data) => data.products as ProductDetail[])
      .catch((err) => {
        cachedRequest = null;
        throw err;
      });
  }
  return cachedRequest;
}

// Live product list (prices, stock, new products) shared by catalog and search on the page
export function useStorefrontProducts() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((list) => active && setProducts(list))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  return { products, isLoading: products === null && !error, error };
}
