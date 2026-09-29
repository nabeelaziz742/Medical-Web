import React from "react";
import { Metadata } from "next";
import { PrescriptionDetailView } from "@/components/prescription/PrescriptionDetailView";

export const metadata: Metadata = {
  title: "Prescription Status & Review Details | SAAD Medical Store",
  description: "View prescription review status, verification notes, and secure document details.",
};

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrescriptionDetailView prescriptionId={id} />;
}
