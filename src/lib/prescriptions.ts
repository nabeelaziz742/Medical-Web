import prisma from "@/lib/prisma";
import { savePrescriptionFile, deletePrescriptionFile } from "@/lib/storage";
import { CreatePrescriptionInput, UpdatePrescriptionStatusInput } from "@/lib/validations/prescription";

export interface PopulatedPrescription {
  id: string;
  prescriptionNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  fileUrl: string;
  deliveryAddress: string | null;
  notes: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_CLARIFICATION" | "COMPLETED";
  rejectionReason: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Global in-memory fallback map for development & resilient local storage
const globalForPrescriptions = globalThis as unknown as {
  memoryPrescriptions?: Map<string, PopulatedPrescription>;
};

const memoryPrescriptions =
  globalForPrescriptions.memoryPrescriptions || new Map<string, PopulatedPrescription>();

if (process.env.NODE_ENV !== "production") {
  globalForPrescriptions.memoryPrescriptions = memoryPrescriptions;
}

export function generatePrescriptionNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RX-2026-${timestamp}${random}`.slice(0, 16);
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "NEEDS_CLARIFICATION", "REJECTED"],
  NEEDS_CLARIFICATION: ["UNDER_REVIEW", "PENDING", "REJECTED"],
  APPROVED: ["COMPLETED", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
};

export async function createPrescription(
  userId: string | null,
  input: CreatePrescriptionInput,
  file: {
    buffer: Buffer | Uint8Array;
    name: string;
    type: string;
  }
): Promise<PopulatedPrescription> {
  const savedFile = await savePrescriptionFile(file.buffer, file.name, file.type);
  const prescriptionNumber = generatePrescriptionNumber();
  const fileUrl = `/api/prescriptions/file/${savedFile.storageKey}`;

  let created: PopulatedPrescription | null = null;

  try {
    const dbRecord = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        userId: userId || null,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileSize: savedFile.fileSize,
        storageKey: savedFile.storageKey,
        fileUrl,
        addressId: input.addressId || null,
        deliveryAddress: input.deliveryAddress.trim(),
        notes: input.notes?.trim() || null,
        status: "PENDING",
      },
    });

    created = {
      id: dbRecord.id,
      prescriptionNumber: dbRecord.prescriptionNumber,
      userId: dbRecord.userId,
      customerName: dbRecord.customerName,
      customerPhone: dbRecord.customerPhone,
      customerEmail: dbRecord.customerEmail,
      fileName: dbRecord.fileName,
      fileType: dbRecord.fileType,
      fileSize: dbRecord.fileSize,
      storageKey: dbRecord.storageKey,
      fileUrl: dbRecord.fileUrl,
      deliveryAddress: dbRecord.deliveryAddress,
      notes: dbRecord.notes,
      status: dbRecord.status as PopulatedPrescription["status"],
      rejectionReason: dbRecord.rejectionReason,
      adminNotes: dbRecord.adminNotes,
      reviewedAt: dbRecord.reviewedAt ? dbRecord.reviewedAt.toISOString() : null,
      reviewedBy: dbRecord.reviewedBy,
      createdAt: dbRecord.createdAt.toISOString(),
      updatedAt: dbRecord.updatedAt.toISOString(),
    };
  } catch (err) {
    // Memory fallback
    const id = `rx-${Date.now()}`;
    created = {
      id,
      prescriptionNumber,
      userId: userId || null,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      fileName: savedFile.fileName,
      fileType: savedFile.fileType,
      fileSize: savedFile.fileSize,
      storageKey: savedFile.storageKey,
      fileUrl,
      deliveryAddress: input.deliveryAddress.trim(),
      notes: input.notes?.trim() || null,
      status: "PENDING",
      rejectionReason: null,
      adminNotes: null,
      reviewedAt: null,
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (created) {
    memoryPrescriptions.set(created.id, created);
    memoryPrescriptions.set(created.prescriptionNumber, created);
  }

  return created!;
}

export async function getUserPrescriptions(userId: string): Promise<PopulatedPrescription[]> {
  try {
    const dbRecords = await prisma.prescription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (dbRecords && dbRecords.length > 0) {
      return dbRecords.map((r) => ({
        id: r.id,
        prescriptionNumber: r.prescriptionNumber,
        userId: r.userId,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        fileName: r.fileName,
        fileType: r.fileType,
        fileSize: r.fileSize,
        storageKey: r.storageKey,
        fileUrl: r.fileUrl,
        deliveryAddress: r.deliveryAddress,
        notes: r.notes,
        status: r.status as PopulatedPrescription["status"],
        rejectionReason: r.rejectionReason,
        adminNotes: r.adminNotes,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        reviewedBy: r.reviewedBy,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }
  } catch (err) {
    // Fallback to memory
  }

  const userItems = Array.from(memoryPrescriptions.values()).filter(
    (p, idx, arr) => p.userId === userId && arr.findIndex((x) => x.id === p.id) === idx
  );

  return userItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPrescriptionById(
  idOrNumber: string,
  userId?: string
): Promise<PopulatedPrescription | null> {
  try {
    const dbRecord = await prisma.prescription.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { prescriptionNumber: idOrNumber }],
      },
    });

    if (dbRecord) {
      // Authorization Check
      if (userId && dbRecord.userId && dbRecord.userId !== userId) {
        return null; // Forbidden
      }

      return {
        id: dbRecord.id,
        prescriptionNumber: dbRecord.prescriptionNumber,
        userId: dbRecord.userId,
        customerName: dbRecord.customerName,
        customerPhone: dbRecord.customerPhone,
        customerEmail: dbRecord.customerEmail,
        fileName: dbRecord.fileName,
        fileType: dbRecord.fileType,
        fileSize: dbRecord.fileSize,
        storageKey: dbRecord.storageKey,
        fileUrl: dbRecord.fileUrl,
        deliveryAddress: dbRecord.deliveryAddress,
        notes: dbRecord.notes,
        status: dbRecord.status as PopulatedPrescription["status"],
        rejectionReason: dbRecord.rejectionReason,
        adminNotes: dbRecord.adminNotes,
        reviewedAt: dbRecord.reviewedAt ? dbRecord.reviewedAt.toISOString() : null,
        reviewedBy: dbRecord.reviewedBy,
        createdAt: dbRecord.createdAt.toISOString(),
        updatedAt: dbRecord.updatedAt.toISOString(),
      };
    }
  } catch (err) {
    // Fallback to memory
  }

  const memoryItem = memoryPrescriptions.get(idOrNumber);
  if (!memoryItem) return null;

  if (userId && memoryItem.userId && memoryItem.userId !== userId) {
    return null;
  }

  return memoryItem;
}

export async function updatePrescriptionStatus(
  idOrNumber: string,
  input: UpdatePrescriptionStatusInput,
  reviewerName: string = "Licensed Pharmacist"
): Promise<PopulatedPrescription> {
  const existing = await getPrescriptionById(idOrNumber);
  if (!existing) {
    throw new Error("Prescription not found");
  }

  const currentStatus = existing.status;
  const targetStatus = input.status;

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(targetStatus) && currentStatus !== targetStatus) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
  }

  const reviewedAt = new Date();
  let updated: PopulatedPrescription | null = null;

  try {
    const dbRecord = await prisma.prescription.update({
      where: { id: existing.id },
      data: {
        status: targetStatus,
        rejectionReason: input.rejectionReason?.trim() || null,
        adminNotes: input.adminNotes?.trim() || null,
        reviewedAt,
        reviewedBy: reviewerName,
      },
    });

    updated = {
      id: dbRecord.id,
      prescriptionNumber: dbRecord.prescriptionNumber,
      userId: dbRecord.userId,
      customerName: dbRecord.customerName,
      customerPhone: dbRecord.customerPhone,
      customerEmail: dbRecord.customerEmail,
      fileName: dbRecord.fileName,
      fileType: dbRecord.fileType,
      fileSize: dbRecord.fileSize,
      storageKey: dbRecord.storageKey,
      fileUrl: dbRecord.fileUrl,
      deliveryAddress: dbRecord.deliveryAddress,
      notes: dbRecord.notes,
      status: dbRecord.status as PopulatedPrescription["status"],
      rejectionReason: dbRecord.rejectionReason,
      adminNotes: dbRecord.adminNotes,
      reviewedAt: dbRecord.reviewedAt ? dbRecord.reviewedAt.toISOString() : null,
      reviewedBy: dbRecord.reviewedBy,
      createdAt: dbRecord.createdAt.toISOString(),
      updatedAt: dbRecord.updatedAt.toISOString(),
    };
  } catch (err) {
    updated = {
      ...existing,
      status: targetStatus,
      rejectionReason: input.rejectionReason?.trim() || null,
      adminNotes: input.adminNotes?.trim() || null,
      reviewedAt: reviewedAt.toISOString(),
      reviewedBy: reviewerName,
      updatedAt: new Date().toISOString(),
    };
  }

  if (updated) {
    memoryPrescriptions.set(updated.id, updated);
    memoryPrescriptions.set(updated.prescriptionNumber, updated);
  }

  return updated!;
}

export async function replacePrescriptionFile(
  idOrNumber: string,
  userId: string,
  file: {
    buffer: Buffer | Uint8Array;
    name: string;
    type: string;
  }
): Promise<PopulatedPrescription> {
  const existing = await getPrescriptionById(idOrNumber, userId);
  if (!existing) {
    throw new Error("Prescription not found or unauthorized");
  }

  if (existing.status !== "NEEDS_CLARIFICATION" && existing.status !== "PENDING") {
    throw new Error("File replacement is only allowed when clarification is requested.");
  }

  // Delete previous file from storage
  if (existing.storageKey) {
    await deletePrescriptionFile(existing.storageKey);
  }

  const savedFile = await savePrescriptionFile(file.buffer, file.name, file.type);
  const fileUrl = `/api/prescriptions/file/${savedFile.storageKey}`;

  let updated: PopulatedPrescription | null = null;

  try {
    const dbRecord = await prisma.prescription.update({
      where: { id: existing.id },
      data: {
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileSize: savedFile.fileSize,
        storageKey: savedFile.storageKey,
        fileUrl,
        status: "UNDER_REVIEW",
        rejectionReason: null,
      },
    });

    updated = {
      ...existing,
      fileName: dbRecord.fileName,
      fileType: dbRecord.fileType,
      fileSize: dbRecord.fileSize,
      storageKey: dbRecord.storageKey,
      fileUrl: dbRecord.fileUrl,
      status: "UNDER_REVIEW",
      rejectionReason: null,
      updatedAt: dbRecord.updatedAt.toISOString(),
    };
  } catch (err) {
    updated = {
      ...existing,
      fileName: savedFile.fileName,
      fileType: savedFile.fileType,
      fileSize: savedFile.fileSize,
      storageKey: savedFile.storageKey,
      fileUrl,
      status: "UNDER_REVIEW",
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    };
  }

  if (updated) {
    memoryPrescriptions.set(updated.id, updated);
    memoryPrescriptions.set(updated.prescriptionNumber, updated);
  }

  return updated!;
}
