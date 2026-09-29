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
  const productsList = getAdminProductsListRaw();
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
        o.customerEmail?.toLowerCase().includes(q)
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
// 4. PRODUCT MANAGEMENT
// -------------------------------------------------------------
function getAdminProductsListRaw(): ProductDetail[] {
  const uniqueProducts = Array.from(memoryProducts.values()).filter(
    (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
  );
  return uniqueProducts;
}

export function getAdminProducts(params: {
  search?: string;
  category?: string;
  brand?: string;
  requiresPrescription?: boolean;
  stockStatus?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  let products = getAdminProductsListRaw();

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
      (p) => p.categorySlug.toLowerCase() === params.category?.toLowerCase() || p.category.toLowerCase() === params.category?.toLowerCase()
    );
  }

  if (params.brand && params.brand !== "all") {
    products = products.filter(
      (p) => p.brandSlug.toLowerCase() === params.brand?.toLowerCase() || p.brand.toLowerCase() === params.brand?.toLowerCase()
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

export function getAdminProductById(idOrSlug: string): ProductDetail | null {
  return memoryProducts.get(idOrSlug) || null;
}

export function createAdminProduct(input: AdminProductInput): ProductDetail {
  const existing = memoryProducts.get(input.slug);
  if (existing) {
    throw new Error(`A product with the slug "${input.slug}" already exists.`);
  }

  const categorySlug = input.category.toLowerCase().replace(/\s+/g, "-");
  const brandSlug = input.brand.toLowerCase().replace(/\s+/g, "-");

  const newProduct: ProductDetail = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: input.name.trim(),
    slug: input.slug.trim(),
    genericName: input.genericName?.trim() || undefined,
    brand: input.brand.trim(),
    brandSlug,
    category: input.category.trim(),
    categorySlug,
    packSize: input.packSize.trim(),
    price: input.price,
    comparePrice: input.comparePrice || undefined,
    sku: input.sku.trim().toUpperCase(),
    stockStatus: input.stockStatus,
    stockCount: input.stockCount,
    requiresPrescription: input.requiresPrescription,
    isFeatured: input.isFeatured,
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

export function updateAdminProduct(idOrSlug: string, input: Partial<AdminProductInput>): ProductDetail {
  const existing = memoryProducts.get(idOrSlug);
  if (!existing) {
    throw new Error("Product not found");
  }

  if (input.slug && input.slug !== existing.slug) {
    const slugConflict = memoryProducts.get(input.slug);
    if (slugConflict && slugConflict.id !== existing.id) {
      throw new Error(`A product with the slug "${input.slug}" already exists.`);
    }
  }

  const categorySlug = input.category ? input.category.toLowerCase().replace(/\s+/g, "-") : existing.categorySlug;
  const brandSlug = input.brand ? input.brand.toLowerCase().replace(/\s+/g, "-") : existing.brandSlug;

  const updated: ProductDetail = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    slug: input.slug !== undefined ? input.slug.trim() : existing.slug,
    genericName: input.genericName !== undefined ? (input.genericName?.trim() || undefined) : existing.genericName,
    brand: input.brand !== undefined ? input.brand.trim() : existing.brand,
    brandSlug,
    category: input.category !== undefined ? input.category.trim() : existing.category,
    categorySlug,
    packSize: input.packSize !== undefined ? input.packSize.trim() : existing.packSize,
    price: input.price !== undefined ? input.price : existing.price,
    comparePrice: input.comparePrice !== undefined ? (input.comparePrice || undefined) : existing.comparePrice,
    sku: input.sku !== undefined ? input.sku.trim().toUpperCase() : existing.sku,
    stockStatus: input.stockStatus !== undefined ? input.stockStatus : existing.stockStatus,
    stockCount: input.stockCount !== undefined ? input.stockCount : existing.stockCount,
    requiresPrescription: input.requiresPrescription !== undefined ? input.requiresPrescription : existing.requiresPrescription,
    isFeatured: input.isFeatured !== undefined ? input.isFeatured : existing.isFeatured,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    composition: input.composition !== undefined ? (input.composition?.trim() || undefined) : existing.composition,
    usageInfo: input.usageInfo !== undefined ? (input.usageInfo?.trim() || undefined) : existing.usageInfo,
    warnings: input.warnings !== undefined ? (input.warnings?.trim() || undefined) : existing.warnings,
    storageInfo: input.storageInfo !== undefined ? (input.storageInfo?.trim() || undefined) : existing.storageInfo,
    manufacturer: input.manufacturer !== undefined ? input.manufacturer.trim() : existing.manufacturer,
    image: input.image !== undefined ? (input.image?.trim() || undefined) : existing.image,
  };

  // Update indexes
  if (existing.slug !== updated.slug) {
    memoryProducts.delete(existing.slug);
  }
  memoryProducts.set(updated.id, updated);
  memoryProducts.set(updated.slug, updated);

  return updated;
}

export function deleteAdminProduct(idOrSlug: string): { success: boolean; message: string } {
  const existing = memoryProducts.get(idOrSlug);
  if (!existing) {
    throw new Error("Product not found");
  }

  memoryProducts.delete(existing.id);
  memoryProducts.delete(existing.slug);

  return { success: true, message: `Product "${existing.name}" deleted successfully.` };
}

// -------------------------------------------------------------
// 5. CATEGORY MANAGEMENT
// -------------------------------------------------------------
export function getAdminCategoriesList() {
  const uniqueCategories = Array.from(memoryCategories.values()).filter(
    (c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx
  );
  
  const products = getAdminProductsListRaw();
  return uniqueCategories.map((cat) => ({
    ...cat,
    productCount: products.filter(
      (p) => p.categorySlug.toLowerCase() === cat.slug.toLowerCase() || p.category.toLowerCase() === cat.name.toLowerCase()
    ).length,
  }));
}

export function createAdminCategory(input: AdminCategoryInput) {
  const existing = memoryCategories.get(input.slug);
  if (existing) {
    throw new Error(`Category with slug "${input.slug}" already exists.`);
  }

  const newCat = {
    id: `cat-${input.slug}`,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() || undefined,
    image: input.image?.trim() || undefined,
    displayOrder: input.displayOrder || 0,
    isActive: input.isActive ?? true,
  };

  memoryCategories.set(newCat.id, newCat);
  memoryCategories.set(newCat.slug, newCat);

  return newCat;
}

export function updateAdminCategory(idOrSlug: string, input: Partial<AdminCategoryInput>) {
  const existing = memoryCategories.get(idOrSlug);
  if (!existing) {
    throw new Error("Category not found");
  }

  const updated = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    slug: input.slug !== undefined ? input.slug.trim() : existing.slug,
    description: input.description !== undefined ? (input.description?.trim() || undefined) : existing.description,
    image: input.image !== undefined ? (input.image?.trim() || undefined) : existing.image,
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

export function deleteAdminCategory(idOrSlug: string) {
  const existing = memoryCategories.get(idOrSlug);
  if (!existing) {
    throw new Error("Category not found");
  }

  // Safe deletion check: Check product dependencies
  const products = getAdminProductsListRaw();
  const linkedProducts = products.filter(
    (p) => p.categorySlug.toLowerCase() === existing.slug.toLowerCase() || p.category.toLowerCase() === existing.name.toLowerCase()
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
export function getAdminBrandsList() {
  const uniqueBrands = Array.from(memoryBrands.values()).filter(
    (b, idx, arr) => arr.findIndex((x) => x.id === b.id) === idx
  );

  const products = getAdminProductsListRaw();
  return uniqueBrands.map((brand) => ({
    ...brand,
    productCount: products.filter(
      (p) => p.brandSlug.toLowerCase() === brand.slug.toLowerCase() || p.brand.toLowerCase() === brand.name.toLowerCase()
    ).length,
  }));
}

export function createAdminBrand(input: AdminBrandInput) {
  const existing = memoryBrands.get(input.slug);
  if (existing) {
    throw new Error(`Brand with slug "${input.slug}" already exists.`);
  }

  const newBrand = {
    id: `brand-${input.slug}`,
    name: input.name.trim(),
    slug: input.slug.trim(),
    logo: input.logo?.trim() || undefined,
  };

  memoryBrands.set(newBrand.id, newBrand);
  memoryBrands.set(newBrand.slug, newBrand);

  return newBrand;
}

export function updateAdminBrand(idOrSlug: string, input: Partial<AdminBrandInput>) {
  const existing = memoryBrands.get(idOrSlug);
  if (!existing) {
    throw new Error("Brand not found");
  }

  const updated = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    slug: input.slug !== undefined ? input.slug.trim() : existing.slug,
    logo: input.logo !== undefined ? (input.logo?.trim() || undefined) : existing.logo,
  };

  if (existing.slug !== updated.slug) {
    memoryBrands.delete(existing.slug);
  }
  memoryBrands.set(updated.id, updated);
  memoryBrands.set(updated.slug, updated);

  return updated;
}

export function deleteAdminBrand(idOrSlug: string) {
  const existing = memoryBrands.get(idOrSlug);
  if (!existing) {
    throw new Error("Brand not found");
  }

  // Safe deletion check: Check product dependencies
  const products = getAdminProductsListRaw();
  const linkedProducts = products.filter(
    (p) => p.brandSlug.toLowerCase() === existing.slug.toLowerCase() || p.brand.toLowerCase() === existing.name.toLowerCase()
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
