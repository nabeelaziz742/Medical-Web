import { z } from "zod";

export const createPrescriptionSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z
    .string()
    .regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, "Please enter a valid Pakistani phone number (e.g. 03001234567)"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  addressId: z.string().optional(),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "NEEDS_CLARIFICATION",
    "COMPLETED",
  ]),
  rejectionReason: z.string().max(1000).optional(),
  adminNotes: z.string().max(1000).optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionStatusInput = z.infer<typeof updatePrescriptionStatusSchema>;
