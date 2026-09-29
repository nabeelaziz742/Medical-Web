import React from "react";
import { Metadata } from "next";
import { OrderTrackingView } from "@/components/order/OrderTrackingView";

export const metadata: Metadata = {
  title: "Order Tracking & Confirmation | SAAD Medical Store",
  description: "Track your medicine delivery status in Lahore and review verified pharmacy order details.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderTrackingView orderId={id} />;
}
