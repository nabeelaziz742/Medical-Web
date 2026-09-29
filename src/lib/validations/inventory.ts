import { z } from "zod";

export const stockTransactionTypeEnum = z.enum([
  "PURCHASE",
  "SALE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "RETURN",
  "DAMAGE",
  "EXPIRED",
  "CORRECTION",
]);

export const receiveStockSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  batchNumber: z
    .string()
    .min(1, "Batch number is required")
    .max(50, "Batch number is too long")
    .transform((val) => val.trim().toUpperCase()),
  quantity: z
    .number()
    .int("Quantity must be a whole integer")
    .positive("Received quantity must be greater than 0"),
  purchasePrice: z
    .number()
    .min(0, "Purchase price cannot be negative"),
  sellingPrice: z
    .number()
    .positive("Selling price must be greater than 0"),
  manufacturingDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid manufacturing date"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid expiry date"),
  referenceId: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => {
    if (data.manufacturingDate && data.expiryDate) {
      const mfg = new Date(data.manufacturingDate).getTime();
      const exp = new Date(data.expiryDate).getTime();
      return exp >= mfg;
    }
    return true;
  },
  {
    message: "Expiry date cannot precede manufacturing date",
    path: ["expiryDate"],
  }
);

export const adjustStockSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  productId: z.string().optional(),
  type: z.enum([
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "DAMAGE",
    "EXPIRED",
    "CORRECTION",
    "RETURN",
  ]),
  quantity: z
    .number()
    .int("Quantity must be a whole integer")
    .positive("Adjustment quantity must be greater than 0"),
  notes: z
    .string()
    .min(2, "A detailed note or reason is required for audit history")
    .max(500),
  referenceId: z.string().max(100).optional().nullable(),
});

export const inventoryFilterEnum = z.enum([
  "all",
  "low_stock",
  "out_of_stock",
  "expiring_soon",
  "expired",
  "in_stock",
]);

export const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  filter: inventoryFilterEnum.optional().default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  sortBy: z.enum(["name", "totalStock", "updatedAt", "sku"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const transactionQuerySchema = z.object({
  productId: z.string().optional(),
  batchId: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
