import React from "react";
import { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout — Complete Your Medicine Order | SAAD Medical Store",
  description: "Secure multi-step checkout for authentic medicines and healthcare supplies with home delivery across Lahore.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
