import React from "react";
import { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Shopping Cart — Review Medicines & Healthcare Items",
  description: "View and manage your selected medicines, health supplements, and healthcare products before checkout.",
};

export default function CartPage() {
  return <CartView />;
}
