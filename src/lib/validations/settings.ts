import { z } from "zod";

export const updateSettingsSchema = z.object({
  // Store Information
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  storePhone: z.string().min(5, "Store phone is required").max(30),
  storeEmail: z.string().email("Invalid store email address").max(100),
  storeAddress: z.string().min(5, "Store address is required").max(255),
  storeLocation: z.string().min(2, "Store location is required").max(100),

  // Delivery Configuration
  deliveryFee: z.number().min(0, "Delivery fee cannot be negative").max(10000),
  freeDeliveryThreshold: z.number().min(0, "Free delivery threshold cannot be negative").max(100000),
  isDeliveryEnabled: z.boolean().default(true),

  // Inventory & Pharmacy Rules
  expiryThresholdDays: z.number().int().min(7, "Expiry threshold must be at least 7 days").max(730, "Expiry threshold cannot exceed 2 years"),
  lowStockThreshold: z.number().int().min(1, "Low stock threshold must be at least 1").max(1000),

  // Order Rules
  minOrderValue: z.number().min(0, "Minimum order value cannot be negative").max(100000).default(0),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
