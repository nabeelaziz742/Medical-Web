import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { AdminSettingsView } from "@/components/admin/AdminSettingsView";

export const metadata: Metadata = {
  title: "Store Settings & Operational Rules — SAAD Medical Store Admin",
  description: "Configure store information, delivery rates, expiry warning thresholds, and order rules.",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const initialSettings = await getStoreSettings();

  return <AdminSettingsView initialSettings={initialSettings} adminName={session.name} />;
}
