import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters").max(100),
  customerPhone: z
    .string()
    .regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, "Please enter a valid Pakistani mobile number (e.g. 03001234567)"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  shippingAddressId: z.string().optional(),
  deliveryAddress: z.string().min(5, "Complete delivery address is required"),
  deliveryArea: z.string().min(2, "Area / Locality is required (e.g. Johar Town, Model Town)"),
  deliveryNotes: z.string().max(500, "Delivery notes cannot exceed 500 characters").optional().or(z.literal("")),
  deliveryMethod: z.literal("HOME_DELIVERY").default("HOME_DELIVERY"),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "DIRECT_BANK_TRANSFER"]),
  internalNotes: z.string().max(500, "Notes cannot exceed 500 characters").optional().or(z.literal("")),
  couponCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
