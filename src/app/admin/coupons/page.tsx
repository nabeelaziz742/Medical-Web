import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminCouponsView } from "@/components/admin/AdminCouponsView";

export const metadata: Metadata = {
  title: "Coupon Management — SAAD Medical Store Admin",
  description: "Create, edit, and track promotional coupons and customer discounts.",
};

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return <AdminCouponsView adminName={session.name} />;
}
