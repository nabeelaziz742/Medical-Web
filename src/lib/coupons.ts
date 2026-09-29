import prisma from "@/lib/prisma";
import {
  CreateCouponInput,
  UpdateCouponInput,
  CouponQueryInput,
} from "@/lib/validations/coupon";

export interface PopulatedCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedCouponUsage {
  id: string;
  couponId: string;
  userId: string | null;
  orderId: string;
  orderNumber?: string;
  discountAmount: number;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
}

// Global in-memory storage for coupons
const globalForCoupons = globalThis as unknown as {
  memoryCoupons?: Map<string, PopulatedCoupon>;
  memoryCouponUsages?: PopulatedCouponUsage[];
};

export const memoryCoupons =
  globalForCoupons.memoryCoupons || new Map<string, PopulatedCoupon>();
export const memoryCouponUsages =
  globalForCoupons.memoryCouponUsages || [];

if (process.env.NODE_ENV !== "production") {
  globalForCoupons.memoryCoupons = memoryCoupons;
  globalForCoupons.memoryCouponUsages = memoryCouponUsages;
}

// Seed initial demo coupon if empty
if (memoryCoupons.size === 0) {
  const defaultCoupon: PopulatedCoupon = {
    id: "coup-saad-welcome",
    code: "WELCOME10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderValue: 1000,
    maxDiscount: 500,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 500,
    usageCount: 0,
    perCustomerLimit: 1,
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryCoupons.set(defaultCoupon.id, defaultCoupon);
  memoryCoupons.set(defaultCoupon.code, defaultCoupon);
}

/**
 * Determine dynamic status of a coupon based on current time and usage limits
 */
export function calculateCouponStatus(coupon: {
  isActive: boolean;
  validFrom: Date | string;
  validTo: Date | string;
  usageLimit?: number | null;
  usageCount: number;
}): "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED" {
  if (!coupon.isActive) return "INACTIVE";

  const now = new Date();
  const validTo = new Date(coupon.validTo);
  const validFrom = new Date(coupon.validFrom);

  if (now > validTo) return "EXPIRED";
  if (now < validFrom) return "INACTIVE";
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return "EXHAUSTED";

  return "ACTIVE";
}

/**
 * Validate a coupon code server-side for checkout
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
  userId?: string
): Promise<{
  isValid: boolean;
  coupon: PopulatedCoupon;
  discountAmount: number;
  message: string;
}> {
  const code = rawCode.trim().toUpperCase();

  let couponRecord: PopulatedCoupon | null = null;

  try {
    const dbCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (dbCoupon) {
      couponRecord = {
        id: dbCoupon.id,
        code: dbCoupon.code,
        discountType: dbCoupon.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(dbCoupon.discountValue),
        minOrderValue: dbCoupon.minOrderValue ? Number(dbCoupon.minOrderValue) : null,
        maxDiscount: dbCoupon.maxDiscount ? Number(dbCoupon.maxDiscount) : null,
        validFrom: dbCoupon.validFrom.toISOString(),
        validTo: dbCoupon.validTo.toISOString(),
        usageLimit: dbCoupon.usageLimit,
        usageCount: dbCoupon.usageCount,
        perCustomerLimit: dbCoupon.perCustomerLimit ?? 1,
        isActive: dbCoupon.isActive,
        status: calculateCouponStatus(dbCoupon),
        createdAt: dbCoupon.createdAt.toISOString(),
        updatedAt: dbCoupon.updatedAt.toISOString(),
      };
    }
  } catch (err) {
    // Database fallback to memory map
  }

  if (!couponRecord) {
    couponRecord = memoryCoupons.get(code) || null;
  }

  if (!couponRecord) {
    throw new Error(`Coupon code "${code}" is invalid or does not exist.`);
  }

  // 1. Check Active Status
  if (!couponRecord.isActive) {
    throw new Error(`Coupon code "${code}" is currently inactive.`);
  }

  const now = new Date();
  const validFrom = new Date(couponRecord.validFrom);
  const validTo = new Date(couponRecord.validTo);

  // 2. Check Valid From Date
  if (now < validFrom) {
    throw new Error(`Coupon "${code}" is not active yet (begins ${validFrom.toLocaleDateString()}).`);
  }

  // 3. Check Expiry Date
  if (now > validTo) {
    throw new Error(`Coupon "${code}" expired on ${validTo.toLocaleDateString()}.`);
  }

  // 4. Check Minimum Order Requirement
  if (couponRecord.minOrderValue && subtotal < couponRecord.minOrderValue) {
    throw new Error(
      `Minimum order value of Rs. ${couponRecord.minOrderValue.toLocaleString()} is required to apply "${code}". Current subtotal is Rs. ${subtotal.toLocaleString()}.`
    );
  }

  // 5. Check Total Usage Limit
  if (couponRecord.usageLimit && couponRecord.usageCount >= couponRecord.usageLimit) {
    throw new Error(`Coupon "${code}" has reached its maximum global usage limit.`);
  }

  // 6. Check Per-Customer Usage Limit
  if (userId && couponRecord.perCustomerLimit) {
    let customerUsageCount = 0;
    try {
      customerUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: couponRecord.id,
          userId,
        },
      });
    } catch (err) {
      // Memory fallback count
      customerUsageCount = memoryCouponUsages.filter(
        (u) => u.couponId === couponRecord?.id && u.userId === userId
      ).length;
    }

    if (customerUsageCount >= couponRecord.perCustomerLimit) {
      throw new Error(
        `You have already used coupon "${code}" the maximum allowed number of times (${couponRecord.perCustomerLimit}).`
      );
    }
  }

  // 7. Calculate Server-Side Discount Amount
  let discountAmount = 0;
  if (couponRecord.discountType === "PERCENTAGE") {
    discountAmount = Math.round((subtotal * couponRecord.discountValue) / 100);
    if (couponRecord.maxDiscount && discountAmount > couponRecord.maxDiscount) {
      discountAmount = couponRecord.maxDiscount;
    }
  } else if (couponRecord.discountType === "FIXED") {
    discountAmount = Math.min(couponRecord.discountValue, subtotal);
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    isValid: true,
    coupon: couponRecord,
    discountAmount,
    message: `Coupon "${code}" applied successfully! You saved Rs. ${discountAmount.toLocaleString()}.`,
  };
}

/**
 * Record coupon usage when an order is placed
 */
export async function recordCouponUsage(
  tx: any,
  couponId: string,
  orderId: string,
  userId: string | null,
  discountAmount: number
) {
  if (tx && tx.coupon && tx.couponUsage) {
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    await tx.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId: userId || null,
        discountAmount,
      },
    });
  }

  // Sync with memory
  const memoryCoupon = Array.from(memoryCoupons.values()).find((c) => c.id === couponId);
  if (memoryCoupon) {
    memoryCoupon.usageCount += 1;
    memoryCoupon.status = calculateCouponStatus(memoryCoupon);
    memoryCoupons.set(memoryCoupon.id, memoryCoupon);
    memoryCoupons.set(memoryCoupon.code, memoryCoupon);
  }

  memoryCouponUsages.push({
    id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    couponId,
    userId,
    orderId,
    discountAmount,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Admin: Get paginated list of coupons with filtering
 */
export async function getAdminCoupons(query: CouponQueryInput) {
  const { search, status = "ALL", page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  try {
    const where: any = {};

    if (search) {
      where.code = { contains: search.trim().toUpperCase(), mode: "insensitive" };
    }

    const now = new Date();
    if (status === "ACTIVE") {
      where.isActive = true;
      where.validTo = { gte: now };
      where.validFrom = { lte: now };
    } else if (status === "INACTIVE") {
      where.isActive = false;
    } else if (status === "EXPIRED") {
      where.validTo = { lt: now };
    }

    const [dbCoupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { usages: true },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ]);

    if (dbCoupons) {
      const coupons: PopulatedCoupon[] = dbCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(c.discountValue),
        minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        validFrom: c.validFrom.toISOString(),
        validTo: c.validTo.toISOString(),
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        perCustomerLimit: c.perCustomerLimit ?? 1,
        isActive: c.isActive,
        status: calculateCouponStatus(c),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));

      return {
        coupons,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    }
  } catch (err) {
    // Fallback to memory
  }

  // Memory fallback
  let all = Array.from(
    new Map(Array.from(memoryCoupons.values()).map((c) => [c.id, c])).values()
  );

  if (search) {
    const s = search.trim().toUpperCase();
    all = all.filter((c) => c.code.includes(s));
  }

  if (status !== "ALL") {
    all = all.filter((c) => {
      const cStatus = calculateCouponStatus(c);
      return cStatus === status;
    });
  }

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paginated = all.slice(skip, skip + limit);

  return {
    coupons: paginated.map((c) => ({
      ...c,
      status: calculateCouponStatus(c),
    })),
    pagination: {
      total: all.length,
      page,
      limit,
      totalPages: Math.ceil(all.length / limit) || 1,
    },
  };
}

/**
 * Admin: Get single coupon by ID with usage details
 */
export async function getCouponById(id: string) {
  try {
    const dbCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { name: true, email: true } },
            order: { select: { orderNumber: true } },
          },
        },
      },
    });

    if (dbCoupon) {
      return {
        coupon: {
          id: dbCoupon.id,
          code: dbCoupon.code,
          discountType: dbCoupon.discountType as "PERCENTAGE" | "FIXED",
          discountValue: Number(dbCoupon.discountValue),
          minOrderValue: dbCoupon.minOrderValue ? Number(dbCoupon.minOrderValue) : null,
          maxDiscount: dbCoupon.maxDiscount ? Number(dbCoupon.maxDiscount) : null,
          validFrom: dbCoupon.validFrom.toISOString(),
          validTo: dbCoupon.validTo.toISOString(),
          usageLimit: dbCoupon.usageLimit,
          usageCount: dbCoupon.usageCount,
          perCustomerLimit: dbCoupon.perCustomerLimit ?? 1,
          isActive: dbCoupon.isActive,
          status: calculateCouponStatus(dbCoupon),
          createdAt: dbCoupon.createdAt.toISOString(),
          updatedAt: dbCoupon.updatedAt.toISOString(),
        },
        usages: dbCoupon.usages.map((u) => ({
          id: u.id,
          couponId: u.couponId,
          userId: u.userId,
          customerName: u.user?.name || "Guest / Registered Customer",
          customerEmail: u.user?.email || "N/A",
          orderId: u.orderId,
          orderNumber: u.order?.orderNumber || u.orderId,
          discountAmount: Number(u.discountAmount),
          createdAt: u.createdAt.toISOString(),
        })),
      };
    }
  } catch (err) {
    // Memory fallback
  }

  const memoryCoupon = memoryCoupons.get(id);
  if (!memoryCoupon) return null;

  const usages = memoryCouponUsages
    .filter((u) => u.couponId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    coupon: {
      ...memoryCoupon,
      status: calculateCouponStatus(memoryCoupon),
    },
    usages,
  };
}

/**
 * Admin: Create a new coupon
 */
export async function createCoupon(input: CreateCouponInput): Promise<PopulatedCoupon> {
  const code = input.code.trim().toUpperCase();

  // Check code uniqueness in memory
  const existingInMemory = memoryCoupons.get(code);
  if (existingInMemory) {
    throw new Error(`Coupon with code "${code}" already exists.`);
  }

  let created: PopulatedCoupon | null = null;

  try {
    const existingInDb = await prisma.coupon.findUnique({
      where: { code },
    });
    if (existingInDb) {
      throw new Error(`Coupon with code "${code}" already exists in the database.`);
    }

    const dbCoupon = await prisma.coupon.create({
      data: {
        code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderValue: input.minOrderValue ?? null,
        maxDiscount: input.maxDiscount ?? null,
        validFrom: input.validFrom,
        validTo: input.validTo,
        usageLimit: input.usageLimit ?? null,
        perCustomerLimit: input.perCustomerLimit ?? 1,
        isActive: input.isActive ?? true,
      },
    });

    created = {
      id: dbCoupon.id,
      code: dbCoupon.code,
      discountType: dbCoupon.discountType as "PERCENTAGE" | "FIXED",
      discountValue: Number(dbCoupon.discountValue),
      minOrderValue: dbCoupon.minOrderValue ? Number(dbCoupon.minOrderValue) : null,
      maxDiscount: dbCoupon.maxDiscount ? Number(dbCoupon.maxDiscount) : null,
      validFrom: dbCoupon.validFrom.toISOString(),
      validTo: dbCoupon.validTo.toISOString(),
      usageLimit: dbCoupon.usageLimit,
      usageCount: dbCoupon.usageCount,
      perCustomerLimit: dbCoupon.perCustomerLimit ?? 1,
      isActive: dbCoupon.isActive,
      status: calculateCouponStatus(dbCoupon),
      createdAt: dbCoupon.createdAt.toISOString(),
      updatedAt: dbCoupon.updatedAt.toISOString(),
    };
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }

    const couponId = `coup-${Date.now()}`;
    created = {
      id: couponId,
      code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderValue: input.minOrderValue ?? null,
      maxDiscount: input.maxDiscount ?? null,
      validFrom: input.validFrom.toISOString(),
      validTo: input.validTo.toISOString(),
      usageLimit: input.usageLimit ?? null,
      usageCount: 0,
      perCustomerLimit: input.perCustomerLimit ?? 1,
      isActive: input.isActive ?? true,
      status: calculateCouponStatus({
        isActive: input.isActive ?? true,
        validFrom: input.validFrom,
        validTo: input.validTo,
        usageLimit: input.usageLimit,
        usageCount: 0,
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (created) {
    memoryCoupons.set(created.id, created);
    memoryCoupons.set(created.code, created);
  }

  return created!;
}

/**
 * Admin: Update an existing coupon
 */
export async function updateCoupon(id: string, input: UpdateCouponInput): Promise<PopulatedCoupon> {
  const existing = Array.from(memoryCoupons.values()).find((c) => c.id === id);
  if (!existing) {
    throw new Error("Coupon not found.");
  }

  if (input.code && input.code !== existing.code) {
    const codeConflict = Array.from(memoryCoupons.values()).find(
      (c) => c.id !== id && c.code === input.code
    );
    if (codeConflict) {
      throw new Error(`Coupon with code "${input.code}" already exists.`);
    }
  }

  let updated: PopulatedCoupon | null = null;

  try {
    const dbCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderValue: input.minOrderValue,
        maxDiscount: input.maxDiscount,
        validFrom: input.validFrom,
        validTo: input.validTo,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
        isActive: input.isActive,
      },
    });

    updated = {
      id: dbCoupon.id,
      code: dbCoupon.code,
      discountType: dbCoupon.discountType as "PERCENTAGE" | "FIXED",
      discountValue: Number(dbCoupon.discountValue),
      minOrderValue: dbCoupon.minOrderValue ? Number(dbCoupon.minOrderValue) : null,
      maxDiscount: dbCoupon.maxDiscount ? Number(dbCoupon.maxDiscount) : null,
      validFrom: dbCoupon.validFrom.toISOString(),
      validTo: dbCoupon.validTo.toISOString(),
      usageLimit: dbCoupon.usageLimit,
      usageCount: dbCoupon.usageCount,
      perCustomerLimit: dbCoupon.perCustomerLimit ?? 1,
      isActive: dbCoupon.isActive,
      status: calculateCouponStatus(dbCoupon),
      createdAt: dbCoupon.createdAt.toISOString(),
      updatedAt: dbCoupon.updatedAt.toISOString(),
    };
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }

    updated = {
      ...existing,
      code: input.code || existing.code,
      discountType: input.discountType || existing.discountType,
      discountValue: input.discountValue !== undefined ? input.discountValue : existing.discountValue,
      minOrderValue: input.minOrderValue !== undefined ? input.minOrderValue : existing.minOrderValue,
      maxDiscount: input.maxDiscount !== undefined ? input.maxDiscount : existing.maxDiscount,
      validFrom: input.validFrom ? input.validFrom.toISOString() : existing.validFrom,
      validTo: input.validTo ? input.validTo.toISOString() : existing.validTo,
      usageLimit: input.usageLimit !== undefined ? input.usageLimit : existing.usageLimit,
      perCustomerLimit: input.perCustomerLimit !== undefined ? input.perCustomerLimit : existing.perCustomerLimit,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
      status: calculateCouponStatus({
        isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
        validFrom: input.validFrom || existing.validFrom,
        validTo: input.validTo || existing.validTo,
        usageLimit: input.usageLimit !== undefined ? input.usageLimit : existing.usageLimit,
        usageCount: existing.usageCount,
      }),
    };
  }

  if (updated) {
    memoryCoupons.set(updated.id, updated);
    memoryCoupons.set(updated.code, updated);
  }

  return updated!;
}

/**
 * Admin: Delete or deactivate coupon safely
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; message: string }> {
  const existing = Array.from(memoryCoupons.values()).find((c) => c.id === id);
  if (!existing) {
    throw new Error("Coupon not found.");
  }

  try {
    const usagesCount = await prisma.couponUsage.count({ where: { couponId: id } });
    if (usagesCount > 0) {
      // Deactivate instead of deleting to preserve order ledger history
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      existing.isActive = false;
      existing.status = "INACTIVE";
      memoryCoupons.set(existing.id, existing);
      memoryCoupons.set(existing.code, existing);
      return { success: true, message: "Coupon has active order history and has been deactivated." };
    }

    await prisma.coupon.delete({ where: { id } });
  } catch (err) {
    // Memory fallback
  }

  memoryCoupons.delete(id);
  memoryCoupons.delete(existing.code);

  return { success: true, message: "Coupon deleted successfully." };
}
