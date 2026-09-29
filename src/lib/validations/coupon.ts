import { z } from "zod";

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(2, "Coupon code must be at least 2 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain alphanumeric characters, hyphens, and underscores")
      .transform((val) => val.trim().toUpperCase()),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive("Discount value must be greater than 0"),
    minOrderValue: z.number().min(0, "Minimum order amount cannot be negative").optional().nullable(),
    maxDiscount: z.number().min(0, "Maximum discount amount cannot be negative").optional().nullable(),
    validFrom: z.string().or(z.date()).transform((val) => new Date(val)),
    validTo: z.string().or(z.date()).transform((val) => new Date(val)),
    usageLimit: z.number().int().min(1, "Usage limit must be at least 1").optional().nullable(),
    perCustomerLimit: z.number().int().min(1, "Per-customer usage limit must be at least 1").optional().nullable().default(1),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      return data.validTo.getTime() >= data.validFrom.getTime();
    },
    {
      message: "End date cannot precede start date",
      path: ["validTo"],
    }
  );

export const updateCouponSchema = z
  .object({
    code: z
      .string()
      .min(2, "Coupon code must be at least 2 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain alphanumeric characters, hyphens, and underscores")
      .transform((val) => val.trim().toUpperCase())
      .optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z.number().positive("Discount value must be greater than 0").optional(),
    minOrderValue: z.number().min(0, "Minimum order amount cannot be negative").optional().nullable(),
    maxDiscount: z.number().min(0, "Maximum discount amount cannot be negative").optional().nullable(),
    validFrom: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    validTo: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    usageLimit: z.number().int().min(1, "Usage limit must be at least 1").optional().nullable(),
    perCustomerLimit: z.number().int().min(1, "Per-customer usage limit must be at least 1").optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE" && data.discountValue !== undefined && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.validFrom && data.validTo) {
        return data.validTo.getTime() >= data.validFrom.getTime();
      }
      return true;
    },
    {
      message: "End date cannot precede start date",
      path: ["validTo"],
    }
  );

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Please enter a coupon code").transform((val) => val.trim().toUpperCase()),
  subtotal: z.number().min(0, "Subtotal must be a positive number"),
});

export const couponQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ALL"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CouponQueryInput = z.infer<typeof couponQuerySchema>;
