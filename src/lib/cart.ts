import prisma from "@/lib/prisma";
import { CATALOG_PRODUCTS, ProductDetail } from "@/data/products";

export interface PopulatedCartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    category: string;
    packSize: string;
    price: number;
    comparePrice?: number;
    sku: string;
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    stockCount: number;
    requiresPrescription: boolean;
    image?: string;
  };
  lineTotal: number;
}

export interface CartSummary {
  items: PopulatedCartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryThreshold: number;
  amountForFreeDelivery: number;
}

// Global in-memory fallback for guest/mock carts
const globalForCart = globalThis as unknown as {
  memoryCarts?: Map<string, { productId: string; quantity: number }[]>;
};

const memoryCarts =
  globalForCart.memoryCarts || new Map<string, { productId: string; quantity: number }[]>();

if (process.env.NODE_ENV !== "production") {
  globalForCart.memoryCarts = memoryCarts;
}

import { getDeliveryConfig } from "@/lib/settings";

export function getDeliveryFeeConfig(subtotal: number) {
  return getDeliveryConfig(subtotal);
}

export function findProductById(productId: string): ProductDetail | undefined {
  return CATALOG_PRODUCTS.find((p) => p.id === productId);
}

export async function getValidatedProduct(productId: string) {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
        images: true,
        inventory: true,
      },
    });

    if (dbProduct && dbProduct.isActive) {
      return {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug,
        brand: dbProduct.brand?.name || "SAAD Medical Store",
        category: dbProduct.category.name,
        packSize: dbProduct.packSize || "Standard Pack",
        price: Number(dbProduct.price),
        comparePrice: dbProduct.comparePrice ? Number(dbProduct.comparePrice) : undefined,
        sku: dbProduct.sku,
        stockStatus: (dbProduct.inventory && dbProduct.inventory.totalStock > 0 ? "IN_STOCK" : "OUT_OF_STOCK") as "IN_STOCK" | "OUT_OF_STOCK",
        stockCount: dbProduct.inventory?.totalStock ?? 100,
        requiresPrescription: dbProduct.requiresPrescription,
        image: dbProduct.images[0]?.url,
      };
    }
  } catch (err) {
    // Graceful fallback to static verified catalog
  }

  const catalogProduct = findProductById(productId);
  if (!catalogProduct) return null;

  return {
    id: catalogProduct.id,
    name: catalogProduct.name,
    slug: catalogProduct.slug,
    brand: catalogProduct.brand,
    category: catalogProduct.category,
    packSize: catalogProduct.packSize,
    price: catalogProduct.price,
    comparePrice: catalogProduct.comparePrice,
    sku: catalogProduct.sku,
    stockStatus: catalogProduct.stockStatus,
    stockCount: catalogProduct.stockCount,
    requiresPrescription: catalogProduct.requiresPrescription,
    image: catalogProduct.image,
  };
}

export async function getUserCart(userId: string): Promise<CartSummary> {
  let rawItems: { id?: string; productId: string; quantity: number }[] = [];

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (cart) {
      rawItems = cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
      }));
    } else {
      // Fallback to memory cart
      rawItems = memoryCarts.get(userId) || [];
    }
  } catch (err) {
    rawItems = memoryCarts.get(userId) || [];
  }

  const populatedItems: PopulatedCartItem[] = [];
  let subtotal = 0;
  let totalItemCount = 0;

  for (const item of rawItems) {
    const product = await getValidatedProduct(item.productId);
    if (!product) continue;

    const quantity = Math.max(1, item.quantity);
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    totalItemCount += quantity;

    populatedItems.push({
      id: item.id || `cart-item-${item.productId}`,
      productId: item.productId,
      quantity,
      product,
      lineTotal,
    });
  }

  const feeConfig = getDeliveryFeeConfig(subtotal);

  return {
    items: populatedItems,
    itemCount: totalItemCount,
    subtotal,
    deliveryFee: populatedItems.length > 0 ? feeConfig.deliveryFee : 0,
    total: populatedItems.length > 0 ? subtotal + feeConfig.deliveryFee : 0,
    freeDeliveryThreshold: feeConfig.freeDeliveryThreshold,
    amountForFreeDelivery: feeConfig.amountForFreeDelivery,
  };
}

export async function addItemToUserCart(userId: string, productId: string, quantity: number = 1): Promise<CartSummary> {
  const product = await getValidatedProduct(productId);
  if (!product) {
    throw new Error("Product not found or unavailable");
  }

  if (product.stockStatus === "OUT_OF_STOCK") {
    throw new Error("This product is currently out of stock");
  }

  const safeQuantity = Math.max(1, quantity);

  try {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + safeQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: safeQuantity,
        },
      });
    }
  } catch (err) {
    // Memory fallback
    const items = memoryCarts.get(userId) || [];
    const index = items.findIndex((i) => i.productId === productId);
    if (index >= 0) {
      items[index].quantity += safeQuantity;
    } else {
      items.push({ productId, quantity: safeQuantity });
    }
    memoryCarts.set(userId, items);
  }

  return getUserCart(userId);
}

export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<CartSummary> {
  if (quantity <= 0) {
    return removeItemFromUserCart(userId, productId);
  }

  const product = await getValidatedProduct(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity },
        });
      }
    }
  } catch (err) {
    const items = memoryCarts.get(userId) || [];
    const index = items.findIndex((i) => i.productId === productId);
    if (index >= 0) {
      items[index].quantity = quantity;
      memoryCarts.set(userId, items);
    }
  }

  return getUserCart(userId);
}

export async function removeItemFromUserCart(userId: string, productId: string): Promise<CartSummary> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
        },
      });
    }
  } catch (err) {
    const items = memoryCarts.get(userId) || [];
    const filtered = items.filter((i) => i.productId !== productId);
    memoryCarts.set(userId, filtered);
  }

  return getUserCart(userId);
}

export async function clearUserCart(userId: string): Promise<void> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  } catch (err) {
    memoryCarts.delete(userId);
  }
}
