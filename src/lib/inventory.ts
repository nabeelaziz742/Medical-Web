import prisma from "@/lib/prisma";
import { CATALOG_PRODUCTS, ProductDetail } from "@/data/products";
import { memoryProducts } from "@/lib/admin";
import { ReceiveStockInput, AdjustStockInput, InventoryQueryInput } from "@/lib/validations/inventory";

import { getExpiryThresholdDays } from "@/lib/settings";

// -------------------------------------------------------------
// CONSTANTS & CONFIGURATION
// -------------------------------------------------------------
export const EXPIRING_SOON_DAYS = 90; // Default threshold in days
export const MIN_STOCK_DEFAULT = 10;  // Default low stock threshold

export type ExpiryStatus = "EXPIRED" | "EXPIRING_SOON" | "VALID" | "NO_EXPIRY";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface BatchItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  expiryStatus: ExpiryStatus;
  daysToExpiry: number;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  initialQuantity: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransactionItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  batchId?: string | null;
  batchNumber?: string | null;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURN" | "DAMAGE" | "EXPIRED" | "CORRECTION" | "ADJUSTMENT" | "EXPIRED_DISPOSAL";
  quantity: number;
  balanceAfter?: number | null;
  referenceId?: string | null;
  performedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ProductInventorySummary {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  packSize: string;
  price: number;
  totalStock: number;
  availableStock: number;
  minStockAlert: number;
  stockStatus: StockStatus;
  hasExpiringSoon: boolean;
  hasExpired: boolean;
  batchesCount: number;
  lastMovementDate: string | null;
  batches?: BatchItem[];
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

// -------------------------------------------------------------
// EXPIRY HELPERS
// -------------------------------------------------------------
export function getBatchExpiryStatus(
  expiryDate: Date | string | null | undefined,
  thresholdDays?: number
): ExpiryStatus {
  if (!expiryDate) return "NO_EXPIRY";
  const exp = new Date(expiryDate).getTime();
  const now = Date.now();
  const activeThreshold = thresholdDays !== undefined ? thresholdDays : getExpiryThresholdDays();
  const thresholdTime = now + activeThreshold * 24 * 60 * 60 * 1000;

  if (exp < now) {
    return "EXPIRED";
  }
  if (exp <= thresholdTime) {
    return "EXPIRING_SOON";
  }
  return "VALID";
}

export function getDaysToExpiry(expiryDate: Date | string | null | undefined): number {
  if (!expiryDate) return 9999;
  const exp = new Date(expiryDate).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isBatchSellable(batch: { expiryDate: Date | string; quantity: number; isLocked?: boolean }): boolean {
  if (batch.isLocked) return false;
  if (batch.quantity <= 0) return false;
  return getBatchExpiryStatus(batch.expiryDate) !== "EXPIRED";
}

// -------------------------------------------------------------
// IN-MEMORY DATA STORE FOR FALLBACK & TESTING
// -------------------------------------------------------------
const globalForInventory = globalThis as unknown as {
  memoryBatches?: Map<string, BatchItem>;
  memoryStockTransactions?: StockTransactionItem[];
};

if (!globalForInventory.memoryBatches) {
  globalForInventory.memoryBatches = new Map<string, BatchItem>();
  globalForInventory.memoryStockTransactions = [];

  // Seed sample initial batches for verified catalog items
  const now = new Date();
  const futureExp1 = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
  const futureExp2 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();  // 45 days (Expiring soon)
  const expiredExp = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();  // 15 days ago (Expired)

  CATALOG_PRODUCTS.forEach((prod, index) => {
    // Standard valid batch
    const batch1Id = `batch-${prod.id}-01`;
    const batch1: BatchItem = {
      id: batch1Id,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      batchNumber: `SM-2026-B${index + 1}01`,
      manufacturingDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: futureExp1,
      expiryStatus: "VALID",
      daysToExpiry: getDaysToExpiry(futureExp1),
      purchasePrice: Math.round(prod.price * 0.7),
      sellingPrice: prod.price,
      quantity: Math.max(10, prod.stockCount || 50),
      initialQuantity: Math.max(10, prod.stockCount || 50),
      isLocked: false,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    globalForInventory.memoryBatches!.set(batch1Id, batch1);

    globalForInventory.memoryStockTransactions!.push({
      id: `tx-init-${batch1Id}`,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      batchId: batch1Id,
      batchNumber: batch1.batchNumber,
      type: "PURCHASE",
      quantity: batch1.quantity,
      balanceAfter: batch1.quantity,
      referenceId: "PO-INIT-001",
      performedBy: "admin@saadmedicalstore.com",
      notes: "Initial stock intake",
      createdAt: batch1.createdAt,
    });

    // For first 2 products, add an expiring-soon batch and an expired batch to test filtering
    if (index === 0) {
      const batch2Id = `batch-${prod.id}-02`;
      const batch2: BatchItem = {
        id: batch2Id,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        batchNumber: `SM-2026-B${index + 1}02-EXP`,
        manufacturingDate: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: futureExp2,
        expiryStatus: "EXPIRING_SOON",
        daysToExpiry: getDaysToExpiry(futureExp2),
        purchasePrice: Math.round(prod.price * 0.7),
        sellingPrice: prod.price,
        quantity: 15,
        initialQuantity: 20,
        isLocked: false,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      };
      globalForInventory.memoryBatches!.set(batch2Id, batch2);

      globalForInventory.memoryStockTransactions!.push({
        id: `tx-init-${batch2Id}`,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        batchId: batch2Id,
        batchNumber: batch2.batchNumber,
        type: "PURCHASE",
        quantity: 20,
        balanceAfter: 20,
        referenceId: "PO-INIT-002",
        performedBy: "admin@saadmedicalstore.com",
        notes: "Secondary batch intake",
        createdAt: batch2.createdAt,
      });

      const batch3Id = `batch-${prod.id}-03`;
      const batch3: BatchItem = {
        id: batch3Id,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        batchNumber: `SM-2025-B${index + 1}00-OLD`,
        manufacturingDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: expiredExp,
        expiryStatus: "EXPIRED",
        daysToExpiry: getDaysToExpiry(expiredExp),
        purchasePrice: Math.round(prod.price * 0.7),
        sellingPrice: prod.price,
        quantity: 5,
        initialQuantity: 10,
        isLocked: false,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
      globalForInventory.memoryBatches!.set(batch3Id, batch3);

      globalForInventory.memoryStockTransactions!.push({
        id: `tx-init-${batch3Id}`,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        batchId: batch3Id,
        batchNumber: batch3.batchNumber,
        type: "PURCHASE",
        quantity: 10,
        balanceAfter: 10,
        referenceId: "PO-INIT-003",
        performedBy: "admin@saadmedicalstore.com",
        notes: "Historical intake",
        createdAt: batch3.createdAt,
      });
    }
  });
}

export const memoryBatches = globalForInventory.memoryBatches!;
export const memoryStockTransactions = globalForInventory.memoryStockTransactions!;

export function getMemoryProduct(productIdOrSlug: string): ProductDetail | undefined {
  if (memoryProducts && memoryProducts.has(productIdOrSlug)) {
    return memoryProducts.get(productIdOrSlug);
  }
  const found = CATALOG_PRODUCTS.find(
    (p) => p.id === productIdOrSlug || p.slug === productIdOrSlug
  );
  if (found && memoryProducts) {
    memoryProducts.set(found.id, { ...found });
    memoryProducts.set(found.slug, { ...found });
  }
  return found ? { ...found } : undefined;
}

// -------------------------------------------------------------
// CORE REPOSITORY / SERVICE FUNCTIONS
// -------------------------------------------------------------

/**
 * Get all product inventory summaries with server-side search, filtering, and pagination.
 */
export async function getInventoryProducts(params: Partial<InventoryQueryInput> = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));

  // Try DB first
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        inventory: true,
        batches: {
          orderBy: { expiryDate: "asc" },
        },
        stockTransactions: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    if (dbProducts && dbProducts.length > 0) {
      let list: ProductInventorySummary[] = dbProducts.map((p) => {
        const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0);
        const availableStock = p.batches
          .filter((b) => isBatchSellable(b))
          .reduce((sum, b) => sum + b.quantity, 0);

        const minStockAlert = p.inventory?.minStockAlert ?? MIN_STOCK_DEFAULT;
        let stockStatus: StockStatus = "IN_STOCK";
        if (totalStock === 0) stockStatus = "OUT_OF_STOCK";
        else if (totalStock <= minStockAlert) stockStatus = "LOW_STOCK";

        const hasExpiringSoon = p.batches.some(
          (b) => b.quantity > 0 && getBatchExpiryStatus(b.expiryDate) === "EXPIRING_SOON"
        );
        const hasExpired = p.batches.some(
          (b) => b.quantity > 0 && getBatchExpiryStatus(b.expiryDate) === "EXPIRED"
        );

        return {
          id: p.id,
          productId: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          brand: p.brand?.name || "SAAD Medical Store",
          category: p.category.name,
          packSize: p.packSize || "Standard Pack",
          price: Number(p.price),
          totalStock,
          availableStock,
          minStockAlert,
          stockStatus,
          hasExpiringSoon,
          hasExpired,
          batchesCount: p.batches.length,
          lastMovementDate: p.stockTransactions[0]?.createdAt.toISOString() || null,
        };
      });

      // Apply Search
      if (params.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
      }

      // Apply Filter
      if (params.filter && params.filter !== "all") {
        switch (params.filter) {
          case "low_stock":
            list = list.filter((i) => i.stockStatus === "LOW_STOCK");
            break;
          case "out_of_stock":
            list = list.filter((i) => i.stockStatus === "OUT_OF_STOCK");
            break;
          case "expiring_soon":
            list = list.filter((i) => i.hasExpiringSoon);
            break;
          case "expired":
            list = list.filter((i) => i.hasExpired);
            break;
          case "in_stock":
            list = list.filter((i) => i.stockStatus === "IN_STOCK");
            break;
        }
      }

      // Sort
      if (params.sortBy === "totalStock") {
        list.sort((a, b) =>
          params.sortOrder === "desc" ? b.totalStock - a.totalStock : a.totalStock - b.totalStock
        );
      } else if (params.sortBy === "sku") {
        list.sort((a, b) =>
          params.sortOrder === "desc" ? b.sku.localeCompare(a.sku) : a.sku.localeCompare(b.sku)
        );
      } else {
        list.sort((a, b) =>
          params.sortOrder === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
        );
      }

      const total = list.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginated = list.slice(startIndex, startIndex + limit);

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
  } catch (err) {
    // Fallback to memory store
  }

  // In-memory fallback
  const uniqueProductsMap = new Map<string, ProductDetail>();
  CATALOG_PRODUCTS.forEach((p) => uniqueProductsMap.set(p.id, { ...p }));
  if (memoryProducts) {
    for (const p of memoryProducts.values()) {
      uniqueProductsMap.set(p.id, { ...p });
    }
  }
  const uniqueProducts = Array.from(uniqueProductsMap.values());

  let list: ProductInventorySummary[] = uniqueProducts.map((prod) => {
    const batches = Array.from(memoryBatches.values()).filter((b) => b.productId === prod.id);
    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    const availableStock = batches
      .filter((b) => isBatchSellable(b))
      .reduce((sum, b) => sum + b.quantity, 0);

    const minStockAlert = MIN_STOCK_DEFAULT;
    let stockStatus: StockStatus = "IN_STOCK";
    if (totalStock === 0) stockStatus = "OUT_OF_STOCK";
    else if (totalStock <= minStockAlert) stockStatus = "LOW_STOCK";

    const hasExpiringSoon = batches.some(
      (b) => b.quantity > 0 && getBatchExpiryStatus(b.expiryDate) === "EXPIRING_SOON"
    );
    const hasExpired = batches.some(
      (b) => b.quantity > 0 && getBatchExpiryStatus(b.expiryDate) === "EXPIRED"
    );

    const productTxs = memoryStockTransactions.filter((tx) => tx.productId === prod.id);
    const lastTx = productTxs[productTxs.length - 1];

    return {
      id: prod.id,
      productId: prod.id,
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku,
      brand: prod.brand,
      category: prod.category,
      packSize: prod.packSize,
      price: prod.price,
      totalStock,
      availableStock,
      minStockAlert,
      stockStatus,
      hasExpiringSoon,
      hasExpired,
      batchesCount: batches.length,
      lastMovementDate: lastTx ? lastTx.createdAt : null,
    };
  });

  // Apply Search
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  // Apply Filter
  if (params.filter && params.filter !== "all") {
    switch (params.filter) {
      case "low_stock":
        list = list.filter((i) => i.stockStatus === "LOW_STOCK");
        break;
      case "out_of_stock":
        list = list.filter((i) => i.stockStatus === "OUT_OF_STOCK");
        break;
      case "expiring_soon":
        list = list.filter((i) => i.hasExpiringSoon);
        break;
      case "expired":
        list = list.filter((i) => i.hasExpired);
        break;
      case "in_stock":
        list = list.filter((i) => i.stockStatus === "IN_STOCK");
        break;
    }
  }

  // Sort
  if (params.sortBy === "totalStock") {
    list.sort((a, b) =>
      params.sortOrder === "desc" ? b.totalStock - a.totalStock : a.totalStock - b.totalStock
    );
  } else if (params.sortBy === "sku") {
    list.sort((a, b) =>
      params.sortOrder === "desc" ? b.sku.localeCompare(a.sku) : a.sku.localeCompare(b.sku)
    );
  } else {
    list.sort((a, b) =>
      params.sortOrder === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

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

/**
 * Get detailed product inventory, including all batches and transactions.
 */
export async function getProductInventoryDetail(productIdOrSlug: string) {
  try {
    const dbProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
      },
      include: {
        category: true,
        brand: true,
        inventory: true,
        batches: {
          orderBy: { expiryDate: "asc" },
        },
        stockTransactions: {
          include: { batch: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (dbProduct) {
      const batches: BatchItem[] = dbProduct.batches.map((b) => ({
        id: b.id,
        productId: b.productId,
        productName: dbProduct.name,
        productSku: dbProduct.sku,
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate ? b.manufacturingDate.toISOString() : null,
        expiryDate: b.expiryDate.toISOString(),
        expiryStatus: getBatchExpiryStatus(b.expiryDate),
        daysToExpiry: getDaysToExpiry(b.expiryDate),
        purchasePrice: Number(b.purchasePrice),
        sellingPrice: Number(b.sellingPrice),
        quantity: b.quantity,
        initialQuantity: b.initialQuantity || b.quantity,
        isLocked: b.isLocked,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }));

      const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      const availableStock = batches
        .filter((b) => isBatchSellable(b))
        .reduce((sum, b) => sum + b.quantity, 0);

      const minStockAlert = dbProduct.inventory?.minStockAlert ?? MIN_STOCK_DEFAULT;
      let stockStatus: StockStatus = "IN_STOCK";
      if (totalStock === 0) stockStatus = "OUT_OF_STOCK";
      else if (totalStock <= minStockAlert) stockStatus = "LOW_STOCK";

      const transactions: StockTransactionItem[] = dbProduct.stockTransactions.map((tx) => ({
        id: tx.id,
        productId: tx.productId,
        productName: dbProduct.name,
        productSku: dbProduct.sku,
        batchId: tx.batchId,
        batchNumber: tx.batch?.batchNumber || null,
        type: tx.type as StockTransactionItem["type"],
        quantity: tx.quantity,
        balanceAfter: tx.balanceAfter,
        referenceId: tx.referenceId,
        performedBy: tx.performedBy,
        notes: tx.notes,
        createdAt: tx.createdAt.toISOString(),
      }));

      return {
        product: {
          id: dbProduct.id,
          name: dbProduct.name,
          slug: dbProduct.slug,
          sku: dbProduct.sku,
          brand: dbProduct.brand?.name || "SAAD Medical Store",
          category: dbProduct.category.name,
          packSize: dbProduct.packSize || "Standard Pack",
          price: Number(dbProduct.price),
          totalStock,
          availableStock,
          minStockAlert,
          stockStatus,
          hasExpiringSoon: batches.some((b) => b.quantity > 0 && b.expiryStatus === "EXPIRING_SOON"),
          hasExpired: batches.some((b) => b.quantity > 0 && b.expiryStatus === "EXPIRED"),
          batchesCount: batches.length,
          lastMovementDate: transactions[0]?.createdAt || null,
        },
        batches,
        transactions,
      };
    }
  } catch (err) {
    // Fallback
  }

  // Memory fallback
  const product = getMemoryProduct(productIdOrSlug);
  if (!product) return null;

  const batches = Array.from(memoryBatches.values())
    .filter((b) => b.productId === product.id)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const availableStock = batches
    .filter((b) => isBatchSellable(b))
    .reduce((sum, b) => sum + b.quantity, 0);

  let stockStatus: StockStatus = "IN_STOCK";
  if (totalStock === 0) stockStatus = "OUT_OF_STOCK";
  else if (totalStock <= MIN_STOCK_DEFAULT) stockStatus = "LOW_STOCK";

  const transactions = memoryStockTransactions
    .filter((tx) => tx.productId === product.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      packSize: product.packSize,
      price: product.price,
      totalStock,
      availableStock,
      minStockAlert: MIN_STOCK_DEFAULT,
      stockStatus,
      hasExpiringSoon: batches.some((b) => b.quantity > 0 && b.expiryStatus === "EXPIRING_SOON"),
      hasExpired: batches.some((b) => b.quantity > 0 && b.expiryStatus === "EXPIRED"),
      batchesCount: batches.length,
      lastMovementDate: transactions[0]?.createdAt || null,
    },
    batches,
    transactions,
  };
}

/**
 * Get single batch details and movement ledger.
 */
export async function getBatchDetail(batchId: string) {
  try {
    const dbBatch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        product: {
          include: { category: true, brand: true },
        },
        stockTransactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (dbBatch) {
      const batch: BatchItem = {
        id: dbBatch.id,
        productId: dbBatch.productId,
        productName: dbBatch.product.name,
        productSku: dbBatch.product.sku,
        batchNumber: dbBatch.batchNumber,
        manufacturingDate: dbBatch.manufacturingDate ? dbBatch.manufacturingDate.toISOString() : null,
        expiryDate: dbBatch.expiryDate.toISOString(),
        expiryStatus: getBatchExpiryStatus(dbBatch.expiryDate),
        daysToExpiry: getDaysToExpiry(dbBatch.expiryDate),
        purchasePrice: Number(dbBatch.purchasePrice),
        sellingPrice: Number(dbBatch.sellingPrice),
        quantity: dbBatch.quantity,
        initialQuantity: dbBatch.initialQuantity || dbBatch.quantity,
        isLocked: dbBatch.isLocked,
        createdAt: dbBatch.createdAt.toISOString(),
        updatedAt: dbBatch.updatedAt.toISOString(),
      };

      const transactions: StockTransactionItem[] = dbBatch.stockTransactions.map((tx) => ({
        id: tx.id,
        productId: tx.productId,
        productName: dbBatch.product.name,
        productSku: dbBatch.product.sku,
        batchId: tx.batchId,
        batchNumber: dbBatch.batchNumber,
        type: tx.type as StockTransactionItem["type"],
        quantity: tx.quantity,
        balanceAfter: tx.balanceAfter,
        referenceId: tx.referenceId,
        performedBy: tx.performedBy,
        notes: tx.notes,
        createdAt: tx.createdAt.toISOString(),
      }));

      return {
        batch,
        product: {
          id: dbBatch.product.id,
          name: dbBatch.product.name,
          slug: dbBatch.product.slug,
          sku: dbBatch.product.sku,
          brand: dbBatch.product.brand?.name || "SAAD Medical Store",
          category: dbBatch.product.category.name,
        },
        transactions,
      };
    }
  } catch (err) {
    // Fallback
  }

  // Memory fallback
  const batch = memoryBatches.get(batchId);
  if (!batch) return null;

  const product = getMemoryProduct(batch.productId);
  const transactions = memoryStockTransactions
    .filter((tx) => tx.batchId === batchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    batch,
    product: {
      id: batch.productId,
      name: product?.name || batch.productName,
      slug: product?.slug || batch.productId,
      sku: product?.sku || batch.productSku,
      brand: product?.brand || "SAAD Medical Store",
      category: product?.category || "General Medicine",
    },
    transactions,
  };
}

/**
 * Controlled Stock Receiving / Purchase Entry.
 * Atomically creates or updates batch, increments inventory, and creates PURCHASE transaction.
 */
export async function receiveStock(input: ReceiveStockInput & { performedBy?: string }) {
  const {
    productId,
    batchNumber,
    quantity,
    purchasePrice,
    sellingPrice,
    manufacturingDate,
    expiryDate,
    referenceId,
    notes,
    performedBy = "admin@saadmedicalstore.com",
  } = input;

  if (quantity <= 0) {
    throw new Error("Received quantity must be greater than 0");
  }

  const expDateObj = new Date(expiryDate);
  if (isNaN(expDateObj.getTime())) {
    throw new Error("Invalid expiry date format");
  }

  const mfgDateObj = manufacturingDate ? new Date(manufacturingDate) : null;
  if (mfgDateObj && expDateObj < mfgDateObj) {
    throw new Error("Expiry date cannot precede manufacturing date");
  }

  try {
    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (dbProduct) {
      const result = await prisma.$transaction(async (tx) => {
        // Check if batch already exists for (productId, batchNumber)
        let batch = await tx.batch.findUnique({
          where: {
            productId_batchNumber: {
              productId,
              batchNumber,
            },
          },
        });

        let balanceAfter = 0;
        if (batch) {
          // Update existing batch
          const updatedBatch = await tx.batch.update({
            where: { id: batch.id },
            data: {
              quantity: batch.quantity + quantity,
              initialQuantity: (batch.initialQuantity || batch.quantity) + quantity,
              purchasePrice,
              sellingPrice,
              manufacturingDate: mfgDateObj,
              expiryDate: expDateObj,
            },
          });
          batch = updatedBatch;
          balanceAfter = updatedBatch.quantity;
        } else {
          // Create new batch
          batch = await tx.batch.create({
            data: {
              productId,
              batchNumber,
              quantity,
              initialQuantity: quantity,
              purchasePrice,
              sellingPrice,
              manufacturingDate: mfgDateObj,
              expiryDate: expDateObj,
            },
          });
          balanceAfter = quantity;
        }

        // Upsert inventory totalStock
        await tx.inventory.upsert({
          where: { productId },
          create: {
            productId,
            totalStock: quantity,
            minStockAlert: MIN_STOCK_DEFAULT,
          },
          update: {
            totalStock: { increment: quantity },
          },
        });

        // Record immutable stock transaction
        const transaction = await tx.stockTransaction.create({
          data: {
            productId,
            batchId: batch.id,
            type: "PURCHASE",
            quantity,
            balanceAfter,
            referenceId: referenceId || "PO-DIRECT",
            performedBy,
            notes: notes || `Stock received: ${quantity} units into batch ${batchNumber}`,
          },
        });

        return { batch, transaction };
      });

      return {
        success: true,
        batch: {
          id: result.batch.id,
          productId: result.batch.productId,
          batchNumber: result.batch.batchNumber,
          quantity: result.batch.quantity,
          expiryDate: result.batch.expiryDate.toISOString(),
        },
        transaction: {
          id: result.transaction.id,
          type: result.transaction.type,
          quantity: result.transaction.quantity,
          balanceAfter: result.transaction.balanceAfter,
        },
      };
    }
  } catch (err: any) {
    // Database connection or query failed, fall through to in-memory persistence
  }

  // Memory fallback execution
  const product = getMemoryProduct(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  let batch = Array.from(memoryBatches.values()).find(
    (b) => b.productId === productId && b.batchNumber.toLowerCase() === batchNumber.toLowerCase()
  );

  let batchId = batch?.id || `batch-${productId}-${Date.now()}`;
  let balanceAfter = 0;

  if (batch) {
    batch.quantity += quantity;
    batch.initialQuantity += quantity;
    batch.purchasePrice = purchasePrice;
    batch.sellingPrice = sellingPrice;
    batch.manufacturingDate = mfgDateObj ? mfgDateObj.toISOString() : null;
    batch.expiryDate = expDateObj.toISOString();
    batch.expiryStatus = getBatchExpiryStatus(expDateObj);
    batch.daysToExpiry = getDaysToExpiry(expDateObj);
    batch.updatedAt = new Date().toISOString();
    balanceAfter = batch.quantity;
  } else {
    const newBatch: BatchItem = {
      id: batchId,
      productId,
      productName: product.name,
      productSku: product.sku,
      batchNumber,
      manufacturingDate: mfgDateObj ? mfgDateObj.toISOString() : null,
      expiryDate: expDateObj.toISOString(),
      expiryStatus: getBatchExpiryStatus(expDateObj),
      daysToExpiry: getDaysToExpiry(expDateObj),
      purchasePrice,
      sellingPrice,
      quantity,
      initialQuantity: quantity,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryBatches.set(batchId, newBatch);
    batch = newBatch;
    balanceAfter = quantity;
  }

  // Update product stockCount
  product.stockCount = (product.stockCount || 0) + quantity;
  product.stockStatus = product.stockCount > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
  memoryProducts.set(product.id, product);

  // Add transaction
  const txItem: StockTransactionItem = {
    id: `tx-recv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId,
    productName: product.name,
    productSku: product.sku,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    type: "PURCHASE",
    quantity,
    balanceAfter,
    referenceId: referenceId || "PO-DIRECT",
    performedBy,
    notes: notes || `Stock received: ${quantity} units into batch ${batchNumber}`,
    createdAt: new Date().toISOString(),
  };
  memoryStockTransactions.push(txItem);

  return {
    success: true,
    batch: {
      id: batch.id,
      productId: batch.productId,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate,
    },
    transaction: {
      id: txItem.id,
      type: txItem.type,
      quantity: txItem.quantity,
      balanceAfter: txItem.balanceAfter,
    },
  };
}

/**
 * Controlled Stock Adjustment (Damage, Expired, Correction, Physical Count).
 * Atomically updates batch quantity, updates inventory, and creates adjustment transaction.
 */
export async function adjustStock(input: AdjustStockInput & { performedBy?: string }) {
  const {
    batchId,
    type,
    quantity,
    notes,
    referenceId,
    performedBy = "admin@saadmedicalstore.com",
  } = input;

  if (quantity <= 0) {
    throw new Error("Adjustment quantity must be greater than 0");
  }

  const isDecrease = ["ADJUSTMENT_OUT", "DAMAGE", "EXPIRED", "CORRECTION"].includes(type);

  try {
    const dbBatch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (dbBatch) {
      if (isDecrease && dbBatch.quantity < quantity) {
        throw new Error(
          `Cannot reduce ${quantity} units. Available batch quantity is only ${dbBatch.quantity}.`
        );
      }

      const signedDelta = isDecrease ? -quantity : quantity;
      const newQuantity = dbBatch.quantity + signedDelta;

      const result = await prisma.$transaction(async (tx) => {
        const updatedBatch = await tx.batch.update({
          where: { id: dbBatch.id },
          data: {
            quantity: newQuantity,
          },
        });

        await tx.inventory.updateMany({
          where: { productId: dbBatch.productId },
          data: {
            totalStock: { increment: signedDelta },
          },
        });

        const transaction = await tx.stockTransaction.create({
          data: {
            productId: dbBatch.productId,
            batchId: dbBatch.id,
            type: type as any,
            quantity: signedDelta,
            balanceAfter: newQuantity,
            referenceId: referenceId || "MANUAL_ADJUSTMENT",
            performedBy,
            notes,
          },
        });

        return { batch: updatedBatch, transaction, product: dbBatch.product };
      });

      return {
        success: true,
        batch: {
          id: result.batch.id,
          productId: result.batch.productId,
          batchNumber: result.batch.batchNumber,
          quantity: result.batch.quantity,
        },
        transaction: {
          id: result.transaction.id,
          type: result.transaction.type,
          quantity: result.transaction.quantity,
          balanceAfter: result.transaction.balanceAfter,
        },
      };
    }
  } catch (err: any) {
    if (err.message && (err.message.includes("Cannot reduce") || err.message.includes("greater than 0"))) {
      throw err;
    }
  }

  // Memory fallback
  const batch = memoryBatches.get(batchId);
  if (!batch) {
    throw new Error(`Batch with ID "${batchId}" not found`);
  }

  if (isDecrease && batch.quantity < quantity) {
    throw new Error(
      `Cannot reduce ${quantity} units. Available batch quantity is only ${batch.quantity}.`
    );
  }

  const signedDelta = isDecrease ? -quantity : quantity;
  batch.quantity += signedDelta;
  batch.updatedAt = new Date().toISOString();
  memoryBatches.set(batchId, batch);

  const product = getMemoryProduct(batch.productId);
  if (product) {
    product.stockCount = Math.max(0, (product.stockCount || 0) + signedDelta);
    product.stockStatus = product.stockCount > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
    if (memoryProducts) {
      memoryProducts.set(product.id, product);
    }
  }

  const txItem: StockTransactionItem = {
    id: `tx-adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: batch.productId,
    productName: batch.productName,
    productSku: batch.productSku,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    type,
    quantity: signedDelta,
    balanceAfter: batch.quantity,
    referenceId: referenceId || "MANUAL_ADJUSTMENT",
    performedBy,
    notes,
    createdAt: new Date().toISOString(),
  };
  memoryStockTransactions.push(txItem);

  return {
    success: true,
    batch: {
      id: batch.id,
      productId: batch.productId,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
    },
    transaction: {
      id: txItem.id,
      type: txItem.type,
      quantity: txItem.quantity,
      balanceAfter: txItem.balanceAfter,
    },
  };
}

// -------------------------------------------------------------
// FEFO (FIRST EXPIRY, FIRST OUT) ALLOCATION ENGINE
// -------------------------------------------------------------

/**
 * Determine FEFO allocation plan for a product given required quantity.
 * 1. Excludes expired batches.
 * 2. Sorts valid batches by earliest expiry date first.
 * 3. Splits across multiple batches if necessary.
 * 4. Fails safely if total valid stock is insufficient.
 */
export async function planFEFOAllocation(productId: string, requiredQuantity: number): Promise<BatchAllocation[]> {
  if (requiredQuantity <= 0) return [];

  // Try DB first
  try {
    const batches = await prisma.batch.findMany({
      where: {
        productId,
        quantity: { gt: 0 },
        isLocked: false,
        expiryDate: { gt: new Date() }, // Exclude expired stock
      },
      orderBy: [
        { expiryDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (batches && batches.length > 0) {
      let needed = requiredQuantity;
      const allocations: BatchAllocation[] = [];

      for (const batch of batches) {
        if (needed <= 0) break;
        const allocQty = Math.min(batch.quantity, needed);
        allocations.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate.toISOString(),
          quantity: allocQty,
        });
        needed -= allocQty;
      }

      if (needed > 0) {
        throw new Error(
          `Insufficient unexpired stock for product. Available: ${requiredQuantity - needed}, Requested: ${requiredQuantity}`
        );
      }

      return allocations;
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("prisma")) {
      throw err;
    }
  }

  // Memory fallback
  const validBatches = Array.from(memoryBatches.values())
    .filter((b) => b.productId === productId && isBatchSellable(b))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  let needed = requiredQuantity;
  const allocations: BatchAllocation[] = [];

  for (const batch of validBatches) {
    if (needed <= 0) break;
    const allocQty = Math.min(batch.quantity, needed);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: allocQty,
    });
    needed -= allocQty;
  }

  if (needed > 0) {
    throw new Error(
      `Insufficient unexpired stock for product. Available: ${requiredQuantity - needed}, Requested: ${requiredQuantity}`
    );
  }

  return allocations;
}

/**
 * Execute FEFO stock deduction in memory fallback.
 */
export function deductMemoryFEFOStock(
  allocations: Array<{ productId: string; batchId: string; quantity: number }>,
  orderId: string,
  performedBy: string = "CUSTOMER_CHECKOUT"
) {
  for (const alloc of allocations) {
    const batch = memoryBatches.get(alloc.batchId);
    if (batch) {
      batch.quantity = Math.max(0, batch.quantity - alloc.quantity);
      batch.updatedAt = new Date().toISOString();
      memoryBatches.set(alloc.batchId, batch);

      const product = memoryProducts.get(alloc.productId);
      if (product) {
        product.stockCount = Math.max(0, (product.stockCount || 0) - alloc.quantity);
        product.stockStatus = product.stockCount > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
        memoryProducts.set(product.id, product);
      }

      memoryStockTransactions.push({
        id: `tx-sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: alloc.productId,
        productName: batch.productName,
        productSku: batch.productSku,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        type: "SALE",
        quantity: -alloc.quantity,
        balanceAfter: batch.quantity,
        referenceId: orderId,
        performedBy,
        notes: `Order allocation for ${orderId}`,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

// -------------------------------------------------------------
// STOCK LEDGER & TRANSACTION AUDIT TRAIL
// -------------------------------------------------------------
export async function getInventoryLedger(params: {
  productId?: string;
  batchId?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  try {
    const where: any = {};
    if (params.productId) where.productId = params.productId;
    if (params.batchId) where.batchId = params.batchId;
    if (params.type && params.type !== "all") where.type = params.type;

    const [dbTxs, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        include: {
          product: true,
          batch: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    if (dbTxs && dbTxs.length > 0) {
      const transactions: StockTransactionItem[] = dbTxs.map((tx) => ({
        id: tx.id,
        productId: tx.productId,
        productName: tx.product.name,
        productSku: tx.product.sku,
        batchId: tx.batchId,
        batchNumber: tx.batch?.batchNumber || null,
        type: tx.type as StockTransactionItem["type"],
        quantity: tx.quantity,
        balanceAfter: tx.balanceAfter,
        referenceId: tx.referenceId,
        performedBy: tx.performedBy,
        notes: tx.notes,
        createdAt: tx.createdAt.toISOString(),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
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
  } catch (err) {
    // Fallback
  }

  // Memory fallback
  let list = [...memoryStockTransactions];

  if (params.productId) {
    list = list.filter((t) => t.productId === params.productId);
  }
  if (params.batchId) {
    list = list.filter((t) => t.batchId === params.batchId);
  }
  if (params.type && params.type !== "all") {
    list = list.filter((t) => t.type === params.type);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    transactions: paginated,
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
// OPERATIONAL DASHBOARD METRICS
// -------------------------------------------------------------
export async function getInventoryDashboardMetrics() {
  const result = await getInventoryProducts({ filter: "all", limit: 1000 });
  const allProducts = result.products;

  const lowStockProducts = allProducts.filter((p) => p.stockStatus === "LOW_STOCK");
  const outOfStockProducts = allProducts.filter((p) => p.stockStatus === "OUT_OF_STOCK");

  // Fetch all batches across products
  const allBatches: BatchItem[] = [];
  try {
    const dbBatches = await prisma.batch.findMany({
      include: { product: true },
      orderBy: { expiryDate: "asc" },
    });

    if (dbBatches && dbBatches.length > 0) {
      dbBatches.forEach((b) => {
        allBatches.push({
          id: b.id,
          productId: b.productId,
          productName: b.product.name,
          productSku: b.product.sku,
          batchNumber: b.batchNumber,
          manufacturingDate: b.manufacturingDate ? b.manufacturingDate.toISOString() : null,
          expiryDate: b.expiryDate.toISOString(),
          expiryStatus: getBatchExpiryStatus(b.expiryDate),
          daysToExpiry: getDaysToExpiry(b.expiryDate),
          purchasePrice: Number(b.purchasePrice),
          sellingPrice: Number(b.sellingPrice),
          quantity: b.quantity,
          initialQuantity: b.initialQuantity || b.quantity,
          isLocked: b.isLocked,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        });
      });
    }
  } catch (err) {
    // Fallback
  }

  if (allBatches.length === 0) {
    allBatches.push(...Array.from(memoryBatches.values()));
  }

  const expiringSoonBatches = allBatches.filter(
    (b) => b.quantity > 0 && b.expiryStatus === "EXPIRING_SOON"
  );
  const expiredBatches = allBatches.filter(
    (b) => b.quantity > 0 && b.expiryStatus === "EXPIRED"
  );

  const totalUnits = allProducts.reduce((sum, p) => sum + p.totalStock, 0);

  return {
    lowStockProducts: lowStockProducts.slice(0, 10),
    outOfStockProducts: outOfStockProducts.slice(0, 10),
    expiringSoonBatches: expiringSoonBatches.slice(0, 10),
    expiredBatches: expiredBatches.slice(0, 10),
    counts: {
      totalProducts: allProducts.length,
      totalUnits,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringSoonCount: expiringSoonBatches.length,
      expiredCount: expiredBatches.length,
      totalBatchesCount: allBatches.length,
    },
  };
}
