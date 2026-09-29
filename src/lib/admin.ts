import prisma from "@/lib/prisma";
import { CATALOG_PRODUCTS, BRANDS, ProductDetail } from "@/data/products";
import { CATEGORIES_NAV } from "@/lib/constants";
import { memoryOrders, PopulatedOrder } from "@/lib/orders";
import { getPrescriptionById, updatePrescriptionStatus, PopulatedPrescription, ALLOWED_STATUS_TRANSITIONS as RX_ALLOWED_TRANSITIONS } from "@/lib/prescriptions";
import { AdminOrderUpdateInput, AdminProductInput, AdminCategoryInput, AdminBrandInput, AdminPrescriptionReviewInput } from "@/lib/validations/admin";

// Global persistent in-memory maps for catalog & management entities
const globalForAdmin = globalThis as unknown as {
  memoryProducts?: Map<string, ProductDetail>;
  memoryCategories?: Map<string, { id: string; name: string; slug: string; description?: string; image?: string; displayOrder: number; isActive: boolean }>;
  memoryBrands?: Map<string, { id: string; name: string; slug: string; logo?: string }>;
};

// Initialize Products map
if (!globalForAdmin.memoryProducts) {
  globalForAdmin.memoryProducts = new Map<string, ProductDetail>();
  for (const prod of CATALOG_PRODUCTS) {
    globalForAdmin.memoryProducts.set(prod.id, { ...prod });
    globalForAdmin.memoryProducts.set(prod.slug, { ...prod });
  }
}
export const memoryProducts = globalForAdmin.memoryProducts;

// Initialize Categories map
if (!globalForAdmin.memoryCategories) {
  globalForAdmin.memoryCategories = new Map();
  CATEGORIES_NAV.forEach((cat, idx) => {
    const item = {
      id: `cat-${cat.slug}`,
      name: cat.name,
      slug: cat.slug,
      description: `Premium pharmacy products in ${cat.name}`,
      displayOrder: idx,
      isActive: true,
    };
    globalForAdmin.memoryCategories!.set(item.id, item);
    globalForAdmin.memoryCategories!.set(item.slug, item);
  });
}
export const memoryCategories = globalForAdmin.memoryCategories;

// Initialize Brands map
if (!globalForAdmin.memoryBrands) {
  globalForAdmin.memoryBrands = new Map();
  BRANDS.forEach((brand) => {
    const item = {
      id: `brand-${brand.slug}`,
      name: brand.name,
      slug: brand.slug,
      logo: undefined,
    };
    globalForAdmin.memoryBrands!.set(item.id, item);
    globalForAdmin.memoryBrands!.set(item.slug, item);
  });
}
export const memoryBrands = globalForAdmin.memoryBrands;

// Order Status Transitions Whitelist
export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

import { getInventoryDashboardMetrics } from "@/lib/inventory";

// -------------------------------------------------------------
// 1. DASHBOARD METRICS
// -------------------------------------------------------------
export async function getAdminDashboardMetrics() {
  const allOrders = await getAllAdminOrdersRaw();
  const allPrescriptions = await getAllAdminPrescriptionsRaw();
  const productsList = await getAdminProductsListRaw();
  const customers = await getAdminCustomersListRaw();
  const inventoryMetrics = await getInventoryDashboardMetrics();

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;

  // Completed store revenue (DELIVERED orders)
  const deliveredOrders = allOrders.filter((o) => o.status === "DELIVERED");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Pending prescriptions awaiting review
  const pendingPrescriptions = allPrescriptions.filter(
    (p) => p.status === "PENDING" || p.status === "UNDER_REVIEW"
  ).length;

  // Recent 8 orders
  const recentOrders = allOrders.slice(0, 8);

  // Review queue (pending / under review / needs clarification)
  const prescriptionQueue = allPrescriptions
    .filter((p) => p.status === "PENDING" || p.status === "UNDER_REVIEW" || p.status === "NEEDS_CLARIFICATION")
    .slice(0, 8);

  // Stock attention (low stock or zero stock)
  const stockAttention = productsList
    .filter((p) => p.stockStatus === "LOW_STOCK" || p.stockStatus === "OUT_OF_STOCK" || p.stockCount <= 20)
    .slice(0, 8);

  return {
    overview: {
      totalOrders,
      pendingOrders,
      totalRevenue,
      revenuePeriodLabel: "All-time Delivered Orders",
      totalCustomers: customers.length,
      totalProducts: productsList.length,
      pendingPrescriptions,
      totalUnitsInStock: inventoryMetrics.counts.totalUnits,
      lowStockCount: inventoryMetrics.counts.lowStockCount,
      outOfStockCount: inventoryMetrics.counts.outOfStockCount,
      expiringSoonCount: inventoryMetrics.counts.expiringSoonCount,
      expiredCount: inventoryMetrics.counts.expiredCount,
    },
    recentOrders,
    prescriptionQueue,
    stockAttention,
    inventoryMetrics,
  };
}

// -------------------------------------------------------------
// 2. ORDER MANAGEMENT
// -------------------------------------------------------------
export async function getAllAdminOrdersRaw(): Promise<PopulatedOrder[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    if (dbOrders && dbOrders.length > 0) {
      return dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        userId: o.userId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        deliveryAddress: o.deliveryAddress,
        deliveryArea: o.deliveryArea,
        deliveryNotes: o.deliveryNotes,
        deliveryMethod: o.deliveryMethod,
        status: o.status as PopulatedOrder["status"],
        paymentStatus: o.paymentStatus as PopulatedOrder["paymentStatus"],
        paymentMethod: o.paymentMethod as PopulatedOrder["paymentMethod"],
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.deliveryFee),
        discount: Number(o.discount),
        total: Number(o.total),
        internalNotes: o.internalNotes,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
        })),
      }));
    }
  } catch (err) {
    // Fallback to memory
  }

  const uniqueOrders = Array.from(memoryOrders.values()).filter(
    (o, idx, arr) => arr.findIndex((x) => x.id === o.id) === idx
  );

  return uniqueOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAdminOrders(params: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: "newest" | "oldest" | "amount-high" | "amount-low";
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  let orders = await getAllAdminOrdersRaw();

  // Search filter
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.deliveryArea?.toLowerCase().includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q)
    );
  }

  // Status filter
  if (params.status && params.status !== "all") {
    orders = orders.filter((o) => o.status === params.status);
  }

  // Payment Status filter
  if (params.paymentStatus && params.paymentStatus !== "all") {
    orders = orders.filter((o) => o.paymentStatus === params.paymentStatus);
  }

  // Sorting
  switch (params.sortBy) {
    case "oldest":
      orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "amount-high":
      orders.sort((a, b) => b.total - a.total);
      break;
    case "amount-low":
      orders.sort((a, b) => a.total - b.total);
      break;
    case "newest":
    default:
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const total = orders.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedOrders = orders.slice(startIndex, startIndex + limit);

  return {
    orders: paginatedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getAdminOrderById(idOrNumber: string): Promise<PopulatedOrder | null> {
  try {
    const dbOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: { items: true },
    });

    if (dbOrder) {
      return {
        id: dbOrder.id,
        orderNumber: dbOrder.orderNumber,
        userId: dbOrder.userId,
        customerName: dbOrder.customerName,
        customerPhone: dbOrder.customerPhone,
        customerEmail: dbOrder.customerEmail,
        deliveryAddress: dbOrder.deliveryAddress,
        deliveryArea: dbOrder.deliveryArea,
        deliveryNotes: dbOrder.deliveryNotes,
        deliveryMethod: dbOrder.deliveryMethod,
        status: dbOrder.status as PopulatedOrder["status"],
        paymentStatus: dbOrder.paymentStatus as PopulatedOrder["paymentStatus"],
        paymentMethod: dbOrder.paymentMethod as PopulatedOrder["paymentMethod"],
        subtotal: Number(dbOrder.subtotal),
        deliveryFee: Number(dbOrder.deliveryFee),
        discount: Number(dbOrder.discount),
        total: Number(dbOrder.total),
        internalNotes: dbOrder.internalNotes,
        createdAt: dbOrder.createdAt.toISOString(),
        updatedAt: dbOrder.updatedAt.toISOString(),
        items: dbOrder.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
        })),
      };
    }
  } catch (err) {
    // Fallback to memory
  }

  return memoryOrders.get(idOrNumber) || null;
}

export async function updateAdminOrderStatus(
  idOrNumber: string,
  input: AdminOrderUpdateInput
): Promise<PopulatedOrder> {
  const existing = await getAdminOrderById(idOrNumber);
  if (!existing) {
    throw new Error("Order not found");
  }

  const currentStatus = existing.status;
  const targetStatus = input.status;

  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus) && currentStatus !== targetStatus) {
    throw new Error(`Invalid order status transition from ${currentStatus} to ${targetStatus}`);
  }

  const updatedAt = new Date();
  let updatedOrder: PopulatedOrder | null = null;

  try {
    const dbOrder = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: targetStatus,
        paymentStatus: input.paymentStatus || existing.paymentStatus,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
      },
      include: { items: true },
    });

    updatedOrder = {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      userId: dbOrder.userId,
      customerName: dbOrder.customerName,
      customerPhone: dbOrder.customerPhone,
      customerEmail: dbOrder.customerEmail,
      deliveryAddress: dbOrder.deliveryAddress,
      deliveryArea: dbOrder.deliveryArea,
      deliveryNotes: dbOrder.deliveryNotes,
      deliveryMethod: dbOrder.deliveryMethod,
      status: dbOrder.status as PopulatedOrder["status"],
      paymentStatus: dbOrder.paymentStatus as PopulatedOrder["paymentStatus"],
      paymentMethod: dbOrder.paymentMethod as PopulatedOrder["paymentMethod"],
      subtotal: Number(dbOrder.subtotal),
      deliveryFee: Number(dbOrder.deliveryFee),
      discount: Number(dbOrder.discount),
      total: Number(dbOrder.total),
      internalNotes: dbOrder.internalNotes,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString(),
      items: dbOrder.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
    };
  } catch (err) {
    updatedOrder = {
      ...existing,
      status: targetStatus,
      paymentStatus: input.paymentStatus || existing.paymentStatus,
      internalNotes: input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
      updatedAt: updatedAt.toISOString(),
    };
  }

  if (updatedOrder) {
    memoryOrders.set(updatedOrder.id, updatedOrder);
    memoryOrders.set(updatedOrder.orderNumber, updatedOrder);
  }

  return updatedOrder!;
}

// -------------------------------------------------------------
// 3. PRESCRIPTION REVIEW QUEUE
// -------------------------------------------------------------
export async function getAllAdminPrescriptionsRaw(): Promise<PopulatedPrescription[]> {
  try {
    const dbRecords = await prisma.prescription.findMany({
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

  const globalMemoryRx = (globalThis as any).memoryPrescriptions as Map<string, PopulatedPrescription> | undefined;
  if (!globalMemoryRx) return [];

  const uniqueRx = Array.from(globalMemoryRx.values()).filter(
    (r, idx, arr) => arr.findIndex((x) => x.id === r.id) === idx
  );

  return uniqueRx.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAdminPrescriptions(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  let rxList = await getAllAdminPrescriptionsRaw();

  // Search
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    rxList = rxList.filter(
      (r) =>
        r.prescriptionNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q)
    );
  }

  // Status
  if (params.status && params.status !== "all") {
    rxList = rxList.filter((r) => r.status === params.status);
  }

  const total = rxList.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = rxList.slice(startIndex, startIndex + limit);

  return {
    prescriptions: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// -------------------------------------------------------------
// 4. PRODUCT MANAGEMENT & POSTGRESQL PERSISTENCE
// -------------------------------------------------------------

export function formatDbProductToDetail(p: any, totalStockOverride?: number): ProductDetail {
  const totalStock =
    totalStockOverride !== undefined
      ? totalStockOverride
      : (p.inventory?.totalStock ??
        (p.batches && p.batches.length > 0
          ? p.batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
          : 0));

  const minStock = p.inventory?.minStockAlert ?? 10;
  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
  if (totalStock === 0) stockStatus = "OUT_OF_STOCK";
  else if (totalStock <= minStock) stockStatus = "LOW_STOCK";

  const brandName = p.brand?.name || "General";
  const brandSlug = p.brand?.slug || brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const categoryName = p.category?.name || "Medicines";
  const categorySlug = p.category?.slug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const primaryImage = p.images?.find((img: any) => img.isPrimary)?.url || p.images?.[0]?.url;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    genericName: p.genericName || undefined,
    brand: brandName,
    brandSlug,
    category: categoryName,
    categorySlug,
    packSize: p.packSize || "Standard Pack",
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    sku: p.sku,
    stockStatus,
    stockCount: totalStock,
    requiresPrescription: Boolean(p.requiresPrescription),
    isFeatured: Boolean(p.isFeatured),
    description: p.description || "",
    composition: p.composition || undefined,
    usageInfo: p.usageInfo || undefined,
    warnings: p.warnings || undefined,
    storageInfo: p.storageInfo || undefined,
    manufacturer: p.manufacturer || brandName,
    image: primaryImage || undefined,
  };
}

let isSeedingCatalog = false;
export async function ensureDatabaseCatalogSeeded(): Promise<void> {
  if (isSeedingCatalog) return;
  try {
    const count = await prisma.product.count();
    if (count > 0) return;

    isSeedingCatalog = true;
    for (let i = 0; i < CATALOG_PRODUCTS.length; i++) {
      const p = CATALOG_PRODUCTS[i];
      const categorySlug = p.categorySlug || p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        create: {
          name: p.category,
          slug: categorySlug,
          description: `Pharmacy category: ${p.category}`,
          displayOrder: i,
          isActive: true,
        },
        update: {},
      });

      const brandSlug = p.brandSlug || p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        create: {
          name: p.brand,
          slug: brandSlug,
        },
        update: {},
      });

      const initialStock = p.stockCount || 50;
      const createdProd = await prisma.product.upsert({
        where: { slug: p.slug },
        create: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          genericName: p.genericName || null,
          packSize: p.packSize,
          price: p.price,
          comparePrice: p.comparePrice || null,
          sku: p.sku,
          requiresPrescription: p.requiresPrescription,
          description: p.description,
          composition: p.composition || null,
          usageInfo: p.usageInfo || null,
          warnings: p.warnings || null,
          storageInfo: p.storageInfo || null,
          manufacturer: p.manufacturer,
          isFeatured: Boolean(p.isFeatured),
          isActive: true,
          categoryId: category.id,
          brandId: brand.id,
          ...(p.image
            ? {
                images: {
                  create: {
                    url: p.image,
                    altText: p.name,
                    isPrimary: true,
                  },
                },
              }
            : {}),
        },
        update: {},
      });

      await prisma.inventory.upsert({
        where: { productId: createdProd.id },
        create: {
          productId: createdProd.id,
          totalStock: initialStock,
          minStockAlert: 10,
        },
        update: {},
      });

      const now = new Date();
      const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const batchNumber = `SM-2026-B${i + 1}01`;
      const batch = await prisma.batch.upsert({
        where: {
          productId_batchNumber: {
            productId: createdProd.id,
            batchNumber,
          },
        },
        create: {
          productId: createdProd.id,
          batchNumber,
          manufacturingDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          expiryDate: exp,
          purchasePrice: Math.round(p.price * 0.7 * 100) / 100,
          sellingPrice: p.price,
          quantity: initialStock,
          initialQuantity: initialStock,
          isLocked: false,
        },
        update: {},
      });

      await prisma.stockTransaction.create({
        data: {
          productId: createdProd.id,
          batchId: batch.id,
          type: "PURCHASE",
          quantity: initialStock,
          balanceAfter: initialStock,
          referenceId: "PO-INIT",
          performedBy: "admin@saadmedicalstore.com",
          notes: `Initial catalog intake of ${initialStock} units`,
        },
      });
    }
  } catch (err) {
    // Graceful error handling for DB seeding
  } finally {
    isSeedingCatalog = false;
  }
}

export async function getAdminProductsListRaw(): Promise<ProductDetail[]> {
  try {
    await ensureDatabaseCatalogSeeded();
    const dbProducts = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        inventory: true,
        batches: true,
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => {
        const totalStock =
          p.inventory?.totalStock ?? p.batches.reduce((sum, b) => sum + b.quantity, 0);
        return formatDbProductToDetail(p, totalStock);
      });
    }
  } catch (err) {
    // Database query failed, fall through to memory
  }

  const uniqueProducts = Array.from(memoryProducts.values()).filter(
    (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
  );
  return uniqueProducts;
}

export async function getAdminProducts(params: {
  search?: string;
  category?: string;
  brand?: string;
  requiresPrescription?: boolean;
  stockStatus?: string;
  page?: number;
  limit?: number;
}): Promise<{
  products: ProductDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  let products = await getAdminProductsListRaw();

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.genericName?.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== "all") {
    products = products.filter(
      (p) =>
        p.categorySlug.toLowerCase() === params.category?.toLowerCase() ||
        p.category.toLowerCase() === params.category?.toLowerCase()
    );
  }

  if (params.brand && params.brand !== "all") {
    products = products.filter(
      (p) =>
        p.brandSlug.toLowerCase() === params.brand?.toLowerCase() ||
        p.brand.toLowerCase() === params.brand?.toLowerCase()
    );
  }

  if (params.requiresPrescription !== undefined) {
    products = products.filter((p) => p.requiresPrescription === params.requiresPrescription);
  }

  if (params.stockStatus && params.stockStatus !== "all") {
    products = products.filter((p) => p.stockStatus === params.stockStatus);
  }

  const total = products.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = products.slice(startIndex, startIndex + limit);

  return {
    products: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getAdminProductById(idOrSlug: string): Promise<ProductDetail | null> {
  try {
    await ensureDatabaseCatalogSeeded();
    const dbProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        brand: true,
        inventory: true,
        batches: true,
        images: true,
      },
    });

    if (dbProduct) {
      const totalStock =
        dbProduct.inventory?.totalStock ??
        dbProduct.batches.reduce((sum, b) => sum + b.quantity, 0);
      return formatDbProductToDetail(dbProduct, totalStock);
    }
  } catch (err) {
    // Database query failed, fall through to memory
  }

  return memoryProducts.get(idOrSlug) || null;
}

export async function createAdminProduct(input: AdminProductInput): Promise<ProductDetail> {
  const cleanSlug = input.slug.trim().toLowerCase();
  const cleanSku = input.sku.trim().toUpperCase();

  // 1. Check uniqueness in DB
  try {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { sku: cleanSku }],
      },
    });
    if (existing) {
      if (existing.slug === cleanSlug) {
        throw new Error(`A product with the slug "${input.slug}" already exists.`);
      }
      throw new Error(`A product with the SKU "${input.sku}" already exists.`);
    }
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }
  }

  const memExisting = memoryProducts.get(cleanSlug);
  if (memExisting) {
    throw new Error(`A product with the slug "${input.slug}" already exists.`);
  }

  const categoryName = input.category.trim();
  const categorySlug =
    categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
  const brandName = input.brand.trim();
  const brandSlug =
    brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "generic";

  const initialStock = Math.max(0, Number(input.stockCount) || 0);
  const price = Number(input.price);
  const comparePrice = input.comparePrice ? Number(input.comparePrice) : null;

  try {
    // Upsert Category & Brand before transaction for speed
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      create: {
        name: categoryName,
        slug: categorySlug,
        description: `Pharmacy category: ${categoryName}`,
      },
      update: {},
    });

    let brand: any = null;
    if (brandName) {
      brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        create: {
          name: brandName,
          slug: brandSlug,
        },
        update: {},
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Create Product
        const product = await tx.product.create({
          data: {
            name: input.name.trim(),
            slug: cleanSlug,
            genericName: input.genericName?.trim() || null,
            packSize: input.packSize.trim(),
            price: price,
            comparePrice: comparePrice,
            sku: cleanSku,
            requiresPrescription: Boolean(input.requiresPrescription),
            description: input.description.trim(),
            composition: input.composition?.trim() || null,
            usageInfo: input.usageInfo?.trim() || null,
            warnings: input.warnings?.trim() || null,
            storageInfo: input.storageInfo?.trim() || null,
            manufacturer: input.manufacturer.trim(),
            isFeatured: Boolean(input.isFeatured),
            isActive: true,
            categoryId: category.id,
            brandId: brand ? brand.id : null,
            ...(input.image?.trim()
              ? {
                  images: {
                    create: {
                      url: input.image.trim(),
                      altText: input.name.trim(),
                      isPrimary: true,
                    },
                  },
                }
              : {}),
          },
          include: {
            category: true,
            brand: true,
            images: true,
          },
        });

        // Create Inventory record
        await tx.inventory.create({
          data: {
            productId: product.id,
            totalStock: initialStock,
            minStockAlert: 10,
          },
        });

        // If initial stock > 0, create initial Batch & StockTransaction
        if (initialStock > 0) {
          const now = new Date();
          const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          const batchNumber = `INIT-${cleanSku}`;
          const purchasePrice = Math.round(price * 0.7 * 100) / 100;

          const batch = await tx.batch.create({
            data: {
              productId: product.id,
              batchNumber,
              manufacturingDate: now,
              expiryDate: exp,
              purchasePrice,
              sellingPrice: price,
              quantity: initialStock,
              initialQuantity: initialStock,
              isLocked: false,
            },
          });

          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              batchId: batch.id,
              type: "PURCHASE",
              quantity: initialStock,
              balanceAfter: initialStock,
              referenceId: "INITIAL-STOCK",
              performedBy: "admin@saadmedicalstore.com",
              notes: `Initial stock intake of ${initialStock} units upon product creation`,
            },
          });
        }

        return product;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    const createdDetail = formatDbProductToDetail(result, initialStock);
    memoryProducts.set(createdDetail.id, createdDetail);
    memoryProducts.set(createdDetail.slug, createdDetail);
    return createdDetail;
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }
    // Fallback to memory
    const newProduct: ProductDetail = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: input.name.trim(),
      slug: cleanSlug,
      genericName: input.genericName?.trim() || undefined,
      brand: brandName,
      brandSlug,
      category: categoryName,
      categorySlug,
      packSize: input.packSize.trim(),
      price: input.price,
      comparePrice: input.comparePrice || undefined,
      sku: cleanSku,
      stockStatus: input.stockStatus || "IN_STOCK",
      stockCount: initialStock,
      requiresPrescription: Boolean(input.requiresPrescription),
      isFeatured: Boolean(input.isFeatured),
      description: input.description.trim(),
      composition: input.composition?.trim() || undefined,
      usageInfo: input.usageInfo?.trim() || undefined,
      warnings: input.warnings?.trim() || undefined,
      storageInfo: input.storageInfo?.trim() || undefined,
      manufacturer: input.manufacturer.trim(),
      image: input.image?.trim() || undefined,
    };
    memoryProducts.set(newProduct.id, newProduct);
    memoryProducts.set(newProduct.slug, newProduct);
    return newProduct;
  }
}

export async function updateAdminProduct(
  idOrSlug: string,
  input: Partial<AdminProductInput>
): Promise<ProductDetail> {
  // 1. Try PostgreSQL update first
  try {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        brand: true,
        inventory: true,
        batches: {
          where: { isLocked: false },
          orderBy: { expiryDate: "asc" },
        },
        images: true,
      },
    });

    if (existing) {
      // Check slug / SKU uniqueness
      if (input.slug && input.slug.trim().toLowerCase() !== existing.slug) {
        const slugConflict = await prisma.product.findFirst({
          where: {
            slug: input.slug.trim().toLowerCase(),
            id: { not: existing.id },
          },
        });
        if (slugConflict) {
          throw new Error(`A product with the slug "${input.slug}" already exists.`);
        }
      }

      if (input.sku && input.sku.trim().toUpperCase() !== existing.sku) {
        const skuConflict = await prisma.product.findFirst({
          where: {
            sku: input.sku.trim().toUpperCase(),
            id: { not: existing.id },
          },
        });
        if (skuConflict) {
          throw new Error(`A product with the SKU "${input.sku}" already exists.`);
        }
      }

      // Resolve category & brand
      let categoryId = existing.categoryId;
      if (input.category && input.category.trim() !== existing.category.name) {
        const catName = input.category.trim();
        const catSlug =
          catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
        const cat = await prisma.category.upsert({
          where: { slug: catSlug },
          create: { name: catName, slug: catSlug, description: `Pharmacy category: ${catName}` },
          update: {},
        });
        categoryId = cat.id;
      }

      let brandId = existing.brandId;
      if (input.brand !== undefined) {
        if (input.brand && input.brand.trim()) {
          const bName = input.brand.trim();
          const bSlug =
            bName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "generic";
          const b = await prisma.brand.upsert({
            where: { slug: bSlug },
            create: { name: bName, slug: bSlug },
            update: {},
          });
          brandId = b.id;
        } else {
          brandId = null;
        }
      }

      // Stock adjustment calculation
      const currentStock =
        existing.inventory?.totalStock ??
        existing.batches.reduce((s, b) => s + b.quantity, 0);
      const newStockCount =
        input.stockCount !== undefined ? Math.max(0, Number(input.stockCount)) : currentStock;
      const stockDelta = newStockCount - currentStock;

      const updated = await prisma.$transaction(async (tx) => {
        // Apply stock adjustment if changed
        if (input.stockCount !== undefined && stockDelta !== 0) {
          if (stockDelta > 0) {
            // Stock increase: increment active batch or create new batch
            let targetBatch = existing.batches[0];
            if (targetBatch) {
              await tx.batch.update({
                where: { id: targetBatch.id },
                data: {
                  quantity: { increment: stockDelta },
                  initialQuantity: { increment: stockDelta },
                },
              });
            } else {
              const now = new Date();
              const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
              const newBatch = await tx.batch.create({
                data: {
                  productId: existing.id,
                  batchNumber: `ADJ-${existing.sku}-${Date.now().toString().slice(-4)}`,
                  manufacturingDate: now,
                  expiryDate: exp,
                  purchasePrice:
                    Math.round(Number(input.price || existing.price) * 0.7 * 100) / 100,
                  sellingPrice: Number(input.price || existing.price),
                  quantity: stockDelta,
                  initialQuantity: stockDelta,
                  isLocked: false,
                },
              });
              targetBatch = newBatch;
            }

            await tx.inventory.upsert({
              where: { productId: existing.id },
              create: {
                productId: existing.id,
                totalStock: newStockCount,
                minStockAlert: 10,
              },
              update: {
                totalStock: newStockCount,
              },
            });

            await tx.stockTransaction.create({
              data: {
                productId: existing.id,
                batchId: targetBatch.id,
                type: "ADJUSTMENT_IN",
                quantity: stockDelta,
                balanceAfter: newStockCount,
                referenceId: "PROD-EDIT-STOCK",
                performedBy: "admin@saadmedicalstore.com",
                notes: `Stock increased via product edit (+${stockDelta} units)`,
              },
            });
          } else {
            // Stock decrease (stockDelta < 0)
            let remainingToDeduct = Math.abs(stockDelta);
            for (const batch of existing.batches) {
              if (remainingToDeduct <= 0) break;
              const deductAmount = Math.min(batch.quantity, remainingToDeduct);
              if (deductAmount > 0) {
                await tx.batch.update({
                  where: { id: batch.id },
                  data: {
                    quantity: { decrement: deductAmount },
                  },
                });
                remainingToDeduct -= deductAmount;
              }
            }

            await tx.inventory.upsert({
              where: { productId: existing.id },
              create: {
                productId: existing.id,
                totalStock: newStockCount,
                minStockAlert: 10,
              },
              update: {
                totalStock: newStockCount,
              },
            });

            await tx.stockTransaction.create({
              data: {
                productId: existing.id,
                type: "ADJUSTMENT_OUT",
                quantity: stockDelta,
                balanceAfter: newStockCount,
                referenceId: "PROD-EDIT-STOCK",
                performedBy: "admin@saadmedicalstore.com",
                notes: `Stock decreased via product edit (${stockDelta} units)`,
              },
            });
          }
        }

        // Update product details
        const prodUpdate = await tx.product.update({
          where: { id: existing.id },
          data: {
            name: input.name !== undefined ? input.name.trim() : undefined,
            slug: input.slug !== undefined ? input.slug.trim().toLowerCase() : undefined,
            genericName:
              input.genericName !== undefined
                ? input.genericName?.trim() || null
                : undefined,
            packSize: input.packSize !== undefined ? input.packSize.trim() : undefined,
            price: input.price !== undefined ? Number(input.price) : undefined,
            comparePrice:
              input.comparePrice !== undefined
                ? input.comparePrice
                  ? Number(input.comparePrice)
                  : null
                : undefined,
            sku: input.sku !== undefined ? input.sku.trim().toUpperCase() : undefined,
            requiresPrescription:
              input.requiresPrescription !== undefined
                ? Boolean(input.requiresPrescription)
                : undefined,
            isFeatured:
              input.isFeatured !== undefined ? Boolean(input.isFeatured) : undefined,
            description: input.description !== undefined ? input.description.trim() : undefined,
            composition:
              input.composition !== undefined
                ? input.composition?.trim() || null
                : undefined,
            usageInfo:
              input.usageInfo !== undefined ? input.usageInfo?.trim() || null : undefined,
            warnings:
              input.warnings !== undefined ? input.warnings?.trim() || null : undefined,
            storageInfo:
              input.storageInfo !== undefined ? input.storageInfo?.trim() || null : undefined,
            manufacturer:
              input.manufacturer !== undefined ? input.manufacturer.trim() : undefined,
            categoryId,
            brandId,
            ...(input.image !== undefined
              ? {
                  images: {
                    deleteMany: {},
                    ...(input.image?.trim()
                      ? {
                          create: {
                            url: input.image.trim(),
                            altText: input.name || existing.name,
                            isPrimary: true,
                          },
                        }
                      : {}),
                  },
                }
              : {}),
          },
          include: {
            category: true,
            brand: true,
            inventory: true,
            batches: true,
            images: true,
          },
        });

        return prodUpdate;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      });

      const updatedDetail = formatDbProductToDetail(updated, newStockCount);
      if (existing.slug !== updatedDetail.slug) {
        memoryProducts.delete(existing.slug);
      }
      memoryProducts.set(updatedDetail.id, updatedDetail);
      memoryProducts.set(updatedDetail.slug, updatedDetail);
      return updatedDetail;
    }
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes("already exists") || err.message.includes("Cannot delete"))
    ) {
      throw err;
    }
  }

  // Fallback to memory
  const memExisting = memoryProducts.get(idOrSlug);
  if (!memExisting) {
    throw new Error("Product not found");
  }

  if (input.slug && input.slug !== memExisting.slug) {
    const slugConflict = memoryProducts.get(input.slug);
    if (slugConflict && slugConflict.id !== memExisting.id) {
      throw new Error(`A product with the slug "${input.slug}" already exists.`);
    }
  }

  const categorySlug = input.category
    ? input.category.toLowerCase().replace(/\s+/g, "-")
    : memExisting.categorySlug;
  const brandSlug = input.brand
    ? input.brand.toLowerCase().replace(/\s+/g, "-")
    : memExisting.brandSlug;

  const updated: ProductDetail = {
    ...memExisting,
    name: input.name !== undefined ? input.name.trim() : memExisting.name,
    slug: input.slug !== undefined ? input.slug.trim() : memExisting.slug,
    genericName:
      input.genericName !== undefined
        ? input.genericName?.trim() || undefined
        : memExisting.genericName,
    brand: input.brand !== undefined ? input.brand.trim() : memExisting.brand,
    brandSlug,
    category: input.category !== undefined ? input.category.trim() : memExisting.category,
    categorySlug,
    packSize: input.packSize !== undefined ? input.packSize.trim() : memExisting.packSize,
    price: input.price !== undefined ? input.price : memExisting.price,
    comparePrice:
      input.comparePrice !== undefined
        ? input.comparePrice || undefined
        : memExisting.comparePrice,
    sku: input.sku !== undefined ? input.sku.trim().toUpperCase() : memExisting.sku,
    stockStatus: input.stockStatus !== undefined ? input.stockStatus : memExisting.stockStatus,
    stockCount: input.stockCount !== undefined ? input.stockCount : memExisting.stockCount,
    requiresPrescription:
      input.requiresPrescription !== undefined
        ? input.requiresPrescription
        : memExisting.requiresPrescription,
    isFeatured: input.isFeatured !== undefined ? input.isFeatured : memExisting.isFeatured,
    description: input.description !== undefined ? input.description.trim() : memExisting.description,
    composition:
      input.composition !== undefined
        ? input.composition?.trim() || undefined
        : memExisting.composition,
    usageInfo:
      input.usageInfo !== undefined ? input.usageInfo?.trim() || undefined : memExisting.usageInfo,
    warnings:
      input.warnings !== undefined ? input.warnings?.trim() || undefined : memExisting.warnings,
    storageInfo:
      input.storageInfo !== undefined
        ? input.storageInfo?.trim() || undefined
        : memExisting.storageInfo,
    manufacturer:
      input.manufacturer !== undefined ? input.manufacturer.trim() : memExisting.manufacturer,
    image: input.image !== undefined ? input.image?.trim() || undefined : memExisting.image,
  };

  if (memExisting.slug !== updated.slug) {
    memoryProducts.delete(memExisting.slug);
  }
  memoryProducts.set(updated.id, updated);
  memoryProducts.set(updated.slug, updated);

  return updated;
}

export async function deleteAdminProduct(
  idOrSlug: string
): Promise<{ success: boolean; message: string }> {
  try {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (existing) {
      // 1. Safety check: Protect historical order history
      const orderItemsCount = await prisma.orderItem.count({
        where: { productId: existing.id },
      });

      if (orderItemsCount > 0) {
        throw new Error(
          `Cannot delete product "${existing.name}" because it is referenced in ${orderItemsCount} historical customer order(s). To discontinue this item without destroying order history, edit the product and set its stock to 0 or mark it inactive.`
        );
      }

      // 2. Safe to delete: Delete product in PostgreSQL
      // Related records (inventory, batches, stockTransactions, productImages, cartItems, wishlistItems) cascade delete
      await prisma.product.delete({
        where: { id: existing.id },
      });

      memoryProducts.delete(existing.id);
      memoryProducts.delete(existing.slug);

      return {
        success: true,
        message: `Product "${existing.name}" deleted successfully from database.`,
      };
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot delete product")) {
      throw err;
    }
  }

  // Memory fallback
  const memExisting = memoryProducts.get(idOrSlug);
  if (!memExisting) {
    throw new Error("Product not found");
  }

  memoryProducts.delete(memExisting.id);
  memoryProducts.delete(memExisting.slug);

  return { success: true, message: `Product "${memExisting.name}" deleted successfully.` };
}

// -------------------------------------------------------------
// 5. CATEGORY MANAGEMENT
// -------------------------------------------------------------
export async function getAdminCategoriesList() {
  try {
    const dbCategories = await prisma.category.findMany({
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || undefined,
        image: cat.image || undefined,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        productCount: cat.products.length,
      }));
    }
  } catch (err) {
    // Fallback
  }

  const uniqueCategories = Array.from(memoryCategories.values()).filter(
    (c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx
  );

  const products = await getAdminProductsListRaw();
  return uniqueCategories.map((cat) => ({
    ...cat,
    productCount: products.filter(
      (p) =>
        p.categorySlug.toLowerCase() === cat.slug.toLowerCase() ||
        p.category.toLowerCase() === cat.name.toLowerCase()
    ).length,
  }));
}

export async function createAdminCategory(input: AdminCategoryInput) {
  const slug = input.slug.trim().toLowerCase();
  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Category with slug "${input.slug}" already exists.`);
    }

    const created = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        image: input.image?.trim() || null,
        displayOrder: input.displayOrder || 0,
        isActive: input.isActive ?? true,
      },
    });

    const catObj = {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description || undefined,
      image: created.image || undefined,
      displayOrder: created.displayOrder,
      isActive: created.isActive,
    };
    memoryCategories.set(catObj.id, catObj);
    memoryCategories.set(catObj.slug, catObj);
    return catObj;
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) throw err;
  }

  const existing = memoryCategories.get(slug);
  if (existing) {
    throw new Error(`Category with slug "${input.slug}" already exists.`);
  }

  const newCat = {
    id: `cat-${slug}`,
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || undefined,
    image: input.image?.trim() || undefined,
    displayOrder: input.displayOrder || 0,
    isActive: input.isActive ?? true,
  };

  memoryCategories.set(newCat.id, newCat);
  memoryCategories.set(newCat.slug, newCat);

  return newCat;
}

export async function updateAdminCategory(idOrSlug: string, input: Partial<AdminCategoryInput>) {
  try {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });

    if (existing) {
      if (input.slug && input.slug.trim().toLowerCase() !== existing.slug) {
        const slugConflict = await prisma.category.findUnique({
          where: { slug: input.slug.trim().toLowerCase() },
        });
        if (slugConflict && slugConflict.id !== existing.id) {
          throw new Error(`Category with slug "${input.slug}" already exists.`);
        }
      }

      const updated = await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: input.name !== undefined ? input.name.trim() : undefined,
          slug: input.slug !== undefined ? input.slug.trim().toLowerCase() : undefined,
          description:
            input.description !== undefined ? input.description?.trim() || null : undefined,
          image: input.image !== undefined ? input.image?.trim() || null : undefined,
          displayOrder: input.displayOrder !== undefined ? input.displayOrder : undefined,
          isActive: input.isActive !== undefined ? input.isActive : undefined,
        },
      });

      const catObj = {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description || undefined,
        image: updated.image || undefined,
        displayOrder: updated.displayOrder,
        isActive: updated.isActive,
      };

      if (existing.slug !== catObj.slug) {
        memoryCategories.delete(existing.slug);
      }
      memoryCategories.set(catObj.id, catObj);
      memoryCategories.set(catObj.slug, catObj);
      return catObj;
    }
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) throw err;
  }

  const existing = memoryCategories.get(idOrSlug);
  if (!existing) {
    throw new Error("Category not found");
  }

  const updated = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    slug: input.slug !== undefined ? input.slug.trim() : existing.slug,
    description:
      input.description !== undefined
        ? input.description?.trim() || undefined
        : existing.description,
    image: input.image !== undefined ? input.image?.trim() || undefined : existing.image,
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
  };

  if (existing.slug !== updated.slug) {
    memoryCategories.delete(existing.slug);
  }
  memoryCategories.set(updated.id, updated);
  memoryCategories.set(updated.slug, updated);

  return updated;
}

export async function deleteAdminCategory(idOrSlug: string) {
  try {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { products: { select: { id: true } } },
    });

    if (existing) {
      if (existing.products.length > 0) {
        throw new Error(
          `Cannot delete category "${existing.name}" because ${existing.products.length} product(s) are currently assigned to it. Please reassign or delete these products first.`
        );
      }

      await prisma.category.delete({
        where: { id: existing.id },
      });

      memoryCategories.delete(existing.id);
      memoryCategories.delete(existing.slug);

      return { success: true, message: `Category "${existing.name}" deleted successfully.` };
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot delete category")) throw err;
  }

  const existing = memoryCategories.get(idOrSlug);
  if (!existing) {
    throw new Error("Category not found");
  }

  // Safe deletion check: Check product dependencies
  const products = await getAdminProductsListRaw();
  const linkedProducts = products.filter(
    (p) =>
      p.categorySlug.toLowerCase() === existing.slug.toLowerCase() ||
      p.category.toLowerCase() === existing.name.toLowerCase()
  );

  if (linkedProducts.length > 0) {
    throw new Error(
      `Cannot delete category "${existing.name}" because ${linkedProducts.length} product(s) are currently assigned to it. Please reassign or delete these products first.`
    );
  }

  memoryCategories.delete(existing.id);
  memoryCategories.delete(existing.slug);

  return { success: true, message: `Category "${existing.name}" deleted successfully.` };
}

// -------------------------------------------------------------
// 6. BRAND MANAGEMENT
// -------------------------------------------------------------
export async function getAdminBrandsList() {
  try {
    const dbBrands = await prisma.brand.findMany({
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    if (dbBrands && dbBrands.length > 0) {
      return dbBrands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo || undefined,
        productCount: brand.products.length,
      }));
    }
  } catch (err) {
    // Fallback
  }

  const uniqueBrands = Array.from(memoryBrands.values()).filter(
    (b, idx, arr) => arr.findIndex((x) => x.id === b.id) === idx
  );

  const products = await getAdminProductsListRaw();
  return uniqueBrands.map((brand) => ({
    ...brand,
    productCount: products.filter(
      (p) =>
        p.brandSlug.toLowerCase() === brand.slug.toLowerCase() ||
        p.brand.toLowerCase() === brand.name.toLowerCase()
    ).length,
  }));
}

export async function createAdminBrand(input: AdminBrandInput) {
  const slug = input.slug.trim().toLowerCase();
  try {
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Brand with slug "${input.slug}" already exists.`);
    }

    const created = await prisma.brand.create({
      data: {
        name: input.name.trim(),
        slug,
        logo: input.logo?.trim() || null,
      },
    });

    const brandObj = {
      id: created.id,
      name: created.name,
      slug: created.slug,
      logo: created.logo || undefined,
    };
    memoryBrands.set(brandObj.id, brandObj);
    memoryBrands.set(brandObj.slug, brandObj);
    return brandObj;
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) throw err;
  }

  const existing = memoryBrands.get(slug);
  if (existing) {
    throw new Error(`Brand with slug "${input.slug}" already exists.`);
  }

  const newBrand = {
    id: `brand-${slug}`,
    name: input.name.trim(),
    slug,
    logo: input.logo?.trim() || undefined,
  };

  memoryBrands.set(newBrand.id, newBrand);
  memoryBrands.set(newBrand.slug, newBrand);

  return newBrand;
}

export async function updateAdminBrand(idOrSlug: string, input: Partial<AdminBrandInput>) {
  try {
    const existing = await prisma.brand.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });

    if (existing) {
      if (input.slug && input.slug.trim().toLowerCase() !== existing.slug) {
        const slugConflict = await prisma.brand.findUnique({
          where: { slug: input.slug.trim().toLowerCase() },
        });
        if (slugConflict && slugConflict.id !== existing.id) {
          throw new Error(`Brand with slug "${input.slug}" already exists.`);
        }
      }

      const updated = await prisma.brand.update({
        where: { id: existing.id },
        data: {
          name: input.name !== undefined ? input.name.trim() : undefined,
          slug: input.slug !== undefined ? input.slug.trim().toLowerCase() : undefined,
          logo: input.logo !== undefined ? input.logo?.trim() || null : undefined,
        },
      });

      const brandObj = {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        logo: updated.logo || undefined,
      };

      if (existing.slug !== brandObj.slug) {
        memoryBrands.delete(existing.slug);
      }
      memoryBrands.set(brandObj.id, brandObj);
      memoryBrands.set(brandObj.slug, brandObj);
      return brandObj;
    }
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) throw err;
  }

  const existing = memoryBrands.get(idOrSlug);
  if (!existing) {
    throw new Error("Brand not found");
  }

  const updated = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    slug: input.slug !== undefined ? input.slug.trim() : existing.slug,
    logo: input.logo !== undefined ? input.logo?.trim() || undefined : existing.logo,
  };

  if (existing.slug !== updated.slug) {
    memoryBrands.delete(existing.slug);
  }
  memoryBrands.set(updated.id, updated);
  memoryBrands.set(updated.slug, updated);

  return updated;
}

export async function deleteAdminBrand(idOrSlug: string) {
  try {
    const existing = await prisma.brand.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { products: { select: { id: true } } },
    });

    if (existing) {
      if (existing.products.length > 0) {
        throw new Error(
          `Cannot delete brand "${existing.name}" because ${existing.products.length} product(s) are currently associated with it. Please reassign or delete these products first.`
        );
      }

      await prisma.brand.delete({
        where: { id: existing.id },
      });

      memoryBrands.delete(existing.id);
      memoryBrands.delete(existing.slug);

      return { success: true, message: `Brand "${existing.name}" deleted successfully.` };
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot delete brand")) throw err;
  }

  const existing = memoryBrands.get(idOrSlug);
  if (!existing) {
    throw new Error("Brand not found");
  }

  // Safe deletion check: Check product dependencies
  const products = await getAdminProductsListRaw();
  const linkedProducts = products.filter(
    (p) =>
      p.brandSlug.toLowerCase() === existing.slug.toLowerCase() ||
      p.brand.toLowerCase() === existing.name.toLowerCase()
  );

  if (linkedProducts.length > 0) {
    throw new Error(
      `Cannot delete brand "${existing.name}" because ${linkedProducts.length} product(s) are currently associated with it. Please reassign or delete these products first.`
    );
  }

  memoryBrands.delete(existing.id);
  memoryBrands.delete(existing.slug);

  return { success: true, message: `Brand "${existing.name}" deleted successfully.` };
}

// -------------------------------------------------------------
// 7. CUSTOMER MANAGEMENT
// -------------------------------------------------------------
async function getAdminCustomersListRaw() {
  const allOrders = await getAllAdminOrdersRaw();
  const allRx = await getAllAdminPrescriptionsRaw();

  let dbUsers: any[] = [];
  try {
    dbUsers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    // Fallback
  }

  // If no DB users found, construct from registered customers in orders/prescriptions
  const customersMap = new Map<string, {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    prescriptionCount: number;
  }>();

  for (const u of dbUsers) {
    const userOrders = allOrders.filter((o) => o.userId === u.id || (o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase()));
    const userRx = allRx.filter((r) => r.userId === u.id || (r.customerEmail && r.customerEmail.toLowerCase() === u.email.toLowerCase()));
    const totalSpent = userOrders.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + o.total, 0);

    customersMap.set(u.id, {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "N/A",
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      orderCount: userOrders.length,
      totalSpent,
      prescriptionCount: userRx.length,
    });
  }

  // Include memory users if present
  const globalMemoryUsers = (globalThis as any).memoryUsers as Map<string, any> | undefined;
  if (globalMemoryUsers) {
    for (const memUser of globalMemoryUsers.values()) {
      if (!customersMap.has(memUser.id)) {
        const userOrders = allOrders.filter((o) => o.userId === memUser.id || (o.customerEmail && o.customerEmail.toLowerCase() === memUser.email?.toLowerCase()));
        const userRx = allRx.filter((r) => r.userId === memUser.id || (r.customerEmail && r.customerEmail.toLowerCase() === memUser.email?.toLowerCase()));
        const totalSpent = userOrders.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + o.total, 0);

        customersMap.set(memUser.id, {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          phone: memUser.phone || "N/A",
          createdAt: memUser.createdAt || new Date().toISOString(),
          orderCount: userOrders.length,
          totalSpent,
          prescriptionCount: userRx.length,
        });
      }
    }
  }

  // Include customers from orders if not already in map
  for (const order of allOrders) {
    const key = order.userId || order.customerEmail || order.customerPhone;
    if (key && !customersMap.has(key)) {
      const userOrders = allOrders.filter((o) => (o.userId && o.userId === order.userId) || (o.customerPhone === order.customerPhone));
      const userRx = allRx.filter((r) => (r.userId && r.userId === order.userId) || (r.customerPhone === order.customerPhone));
      const totalSpent = userOrders.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + o.total, 0);

      customersMap.set(key, {
        id: order.userId || `cust-${key}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        createdAt: order.createdAt,
        orderCount: userOrders.length,
        totalSpent,
        prescriptionCount: userRx.length,
      });
    }
  }

  return Array.from(customersMap.values());
}

export async function getAdminCustomers(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  let customers = await getAdminCustomersListRaw();

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }

  const total = customers.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = customers.slice(startIndex, startIndex + limit);

  return {
    customers: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
