"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PopulatedCartItem, CartSummary } from "@/lib/cart";

interface CartContextType {
  items: PopulatedCartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryThreshold: number;
  amountForFreeDelivery: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PopulatedCartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [amountForFreeDelivery, setAmountForFreeDelivery] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Show cart failures (out of stock, unavailable product) instead of failing silently
  useEffect(() => {
    if (!cartError) return;
    const timer = setTimeout(() => setCartError(null), 4000);
    return () => clearTimeout(timer);
  }, [cartError]);

  const applyCartData = (data: CartSummary) => {
    setItems(data.items || []);
    setItemCount(data.itemCount || 0);
    setSubtotal(data.subtotal || 0);
    setDeliveryFee(data.deliveryFee || 0);
    setTotal(data.total || 0);
    setFreeDeliveryThreshold(data.freeDeliveryThreshold || 2000);
    setAmountForFreeDelivery(data.amountForFreeDelivery || 0);
  };

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        if (data.cart) {
          applyCartData(data.cart);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const addItem = async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add item");
      }

      const data = await res.json();
      if (data.cart) {
        applyCartData(data.cart);
      }
      return true;
    } catch (err) {
      console.error("Cart error:", err);
      setCartError(err instanceof Error ? err.message : "Something went wrong with your cart");
      return false;
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update item");
      }

      const data = await res.json();
      if (data.cart) {
        applyCartData(data.cart);
      }
      return true;
    } catch (err) {
      console.error("Cart error:", err);
      setCartError(err instanceof Error ? err.message : "Something went wrong with your cart");
      return false;
    }
  };

  const removeItem = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove item");
      }

      const data = await res.json();
      if (data.cart) {
        applyCartData(data.cart);
      }
      return true;
    } catch (err) {
      console.error("Cart error:", err);
      setCartError(err instanceof Error ? err.message : "Something went wrong with your cart");
      return false;
    }
  };

  const clearCart = async (): Promise<void> => {
    try {
      const res = await fetch("/api/cart?clear=true", {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cart) {
          applyCartData(data.cart);
        }
      }
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        freeDeliveryThreshold,
        amountForFreeDelivery,
        isLoading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
      {cartError && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100%-2rem)] rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {cartError}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
