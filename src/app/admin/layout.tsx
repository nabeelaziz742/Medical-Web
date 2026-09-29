import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const metadata = {
  title: "Admin Portal | SAAD Medical Store",
  description: "Pharmacy operations and store management for SAAD Medical Store, Lahore.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If user is not logged in as admin, check if on login page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("next-url") || "";

  // If not logged in as ADMIN
  if (!session || session.role !== "ADMIN") {
    // If not already on the login page, redirect to admin login
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <AdminLayoutClient adminName={session.name} adminEmail={session.email}>
      {children}
    </AdminLayoutClient>
  );
}
