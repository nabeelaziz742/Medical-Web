import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, "Please enter a valid Pakistani phone number (e.g., 03001234567)"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, "Please enter your email or phone number"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid admin email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, "Please enter a valid Pakistani phone number (e.g., 03001234567)")
    .optional()
    .or(z.literal("")),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, "Please enter a valid phone number (e.g. 03001234567)"),
  addressLine1: z.string().min(5, "Street address / House number is required"),
  addressLine2: z.string().optional(),
  city: z.string().default("Lahore"),
  area: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
