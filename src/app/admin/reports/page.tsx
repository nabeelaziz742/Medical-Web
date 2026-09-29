import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminReportsView } from "@/components/admin/AdminReportsView";

export const metadata: Metadata = {
  title: "Reports & Financial Analytics — SAAD Medical Store Admin",
  description: "Sales, order breakdown, product performance, inventory movements, and promotional coupon reports.",
};

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return <AdminReportsView adminName={session.name} />;
}
