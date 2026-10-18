import prisma from "@/lib/prisma";
import { CATALOG_PRODUCTS, ProductDetail } from "@/data/products";

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

// Concurrent callers share one seeding run so nobody reads a half-empty catalog
let seedingPromise: Promise<void> | null = null;
export function ensureDatabaseCatalogSeeded(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = seedCatalogIfEmpty().finally(() => {
      seedingPromise = null;
    });
  }
  return seedingPromise;
}

async function seedCatalogIfEmpty(): Promise<void> {
  try {
    const count = await prisma.product.count();
    if (count > 0) return;

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
    console.error("Catalog seeding failed:", err);
  }
}


const storefrontInclude = {
  category: true,
  brand: true,
  inventory: true,
  images: true,
} as const;

// Storefront reads live product data (price, stock, new products) from the database
export async function getStorefrontProducts(): Promise<ProductDetail[]> {
  try {
    await ensureDatabaseCatalogSeeded();
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: storefrontInclude,
      orderBy: { name: "asc" },
    });
    return dbProducts.map((p) => formatDbProductToDetail(p));
  } catch (err) {
    console.error("Storefront product query failed:", err);
    return CATALOG_PRODUCTS;
  }
}

export async function getStorefrontProductBySlug(slug: string): Promise<ProductDetail | undefined> {
  const products = await getStorefrontProducts();
  return products.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}
