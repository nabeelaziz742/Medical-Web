import React from "react";
import { Metadata } from "next";
import { PrescriptionUploadView } from "@/components/prescription/PrescriptionUploadView";

export const metadata: Metadata = {
  title: "Upload Doctor's Prescription | SAAD Medical Store Lahore",
  description: "Securely upload your doctor's prescription for pharmacist review, order verification, and doorstep medicine delivery in Lahore.",
};

export default function PrescriptionPage() {
  return <PrescriptionUploadView />;
}
