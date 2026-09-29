import { z } from "zod";

export const adminOrderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const adminPaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const adminPrescriptionStatusEnum = z.enum([
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "NEEDS_CLARIFICATION",
  "COMPLETED",
]);

export const adminOrderUpdateSchema = z.object({
  status: adminOrderStatusEnum,
  paymentStatus: adminPaymentStatusEnum.optional(),
  internalNotes: z.string().max(1000).optional().nullable(),
});

export const adminProductSchema = z.object({
  name: z.string().min(2, "Product name is required").max(200),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  genericName: z.string().max(200).optional().nullable(),
  packSize: z.string().min(1, "Packaging size is required"),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive("Compare price must be positive").optional().nullable(),
  sku: z.string().min(2, "SKU is required").max(50),
  stockCount: z.number().int().min(0, "Stock count cannot be negative").default(100),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).default("IN_STOCK"),
  requiresPrescription: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  description: z.string().min(5, "Description is required"),
  composition: z.string().optional().nullable(),
  usageInfo: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  storageInfo: z.string().optional().nullable(),
  manufacturer: z.string().min(2, "Manufacturer is required"),
  image: z.string().optional().nullable(),
});

export const adminCategorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(100),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  description: z.string().max(500).optional().nullable(),
  image: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const adminBrandSchema = z.object({
  name: z.string().min(2, "Brand name is required").max(100),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  logo: z.string().optional().nullable(),
});

export const adminPrescriptionReviewSchema = z.object({
  status: adminPrescriptionStatusEnum,
  rejectionReason: z.string().max(1000).optional().nullable(),
  adminNotes: z.string().max(1000).optional().nullable(),
});

export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
export type AdminBrandInput = z.infer<typeof adminBrandSchema>;
export type AdminPrescriptionReviewInput = z.infer<typeof adminPrescriptionReviewSchema>;
