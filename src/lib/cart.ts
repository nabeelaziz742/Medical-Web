import prisma from "@/lib/prisma";
import { getDeliveryConfig, getStoreSettings } from "@/lib/settings";
import { ensureDatabaseCatalogSeeded } from "@/lib/productStore";

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

// Guest carts are keyed by the guest cookie id, signed-in carts by the user id
export function isGuestCartOwner(ownerId: string): boolean {
  return ownerId.startsWith("guest-");
}

function cartOwnerWhere(ownerId: string) {
  return isGuestCartOwner(ownerId) ? { guestId: ownerId } : { userId: ownerId };
}

async function findOrCreateCart(ownerId: string) {
  const where = cartOwnerWhere(ownerId);
  const existing = await prisma.cart.findUnique({ where });
  if (existing) return existing;
  return prisma.cart.create({ data: where });
}

export function getDeliveryFeeConfig(subtotal: number) {
  return getDeliveryConfig(subtotal);
}

export async function getValidatedProduct(productId: string) {
  await ensureDatabaseCatalogSeeded();

  const dbProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      brand: true,
      images: true,
      inventory: true,
    },
  });

  if (!dbProduct || !dbProduct.isActive) return null;

  const stockCount = dbProduct.inventory?.totalStock ?? 0;
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
    stockStatus: (stockCount > 0 ? "IN_STOCK" : "OUT_OF_STOCK") as "IN_STOCK" | "OUT_OF_STOCK",
    stockCount,
    requiresPrescription: dbProduct.requiresPrescription,
    image: dbProduct.images[0]?.url,
  };
}

function assertWithinStock(product: { name: string; stockCount: number }, quantity: number) {
  if (quantity > product.stockCount) {
    throw new Error(
      `Only ${product.stockCount} unit(s) of "${product.name}" are available in stock.`
    );
  }
}

export async function getUserCart(ownerId: string): Promise<CartSummary> {
  await getStoreSettings();

  const cart = await prisma.cart.findUnique({
    where: cartOwnerWhere(ownerId),
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  const populatedItems: PopulatedCartItem[] = [];
  let subtotal = 0;
  let totalItemCount = 0;

  for (const item of cart?.items ?? []) {
    const product = await getValidatedProduct(item.productId);
    if (!product) continue;

    const quantity = Math.max(1, item.quantity);
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    totalItemCount += quantity;

    populatedItems.push({
      id: item.id,
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

export async function addItemToUserCart(ownerId: string, productId: string, quantity: number = 1): Promise<CartSummary> {
  const product = await getValidatedProduct(productId);
  if (!product) {
    throw new Error("Product not found or unavailable");
  }

  if (product.stockStatus === "OUT_OF_STOCK") {
    throw new Error("This product is currently out of stock");
  }

  const safeQuantity = Math.max(1, quantity);
  const cart = await findOrCreateCart(ownerId);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const newQuantity = (existingItem?.quantity ?? 0) + safeQuantity;
  assertWithinStock(product, newQuantity);

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: newQuantity },
    });
  }

  return getUserCart(ownerId);
}

export async function updateCartItemQuantity(ownerId: string, productId: string, quantity: number): Promise<CartSummary> {
  if (quantity <= 0) {
    return removeItemFromUserCart(ownerId, productId);
  }

  const product = await getValidatedProduct(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  assertWithinStock(product, quantity);

  const cart = await prisma.cart.findUnique({ where: cartOwnerWhere(ownerId) });
  if (cart) {
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity },
    });
  }

  return getUserCart(ownerId);
}

export async function removeItemFromUserCart(ownerId: string, productId: string): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({ where: cartOwnerWhere(ownerId) });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  }

  return getUserCart(ownerId);
}

export async function clearUserCart(ownerId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: cartOwnerWhere(ownerId) });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

/**
 * Move a guest's cart into the signed-in user's cart (called right after login/register),
 * so the checkout summary the customer sees is exactly what gets ordered.
 */
export async function mergeGuestCartIntoUser(guestId: string, userId: string): Promise<void> {
  if (!isGuestCartOwner(guestId)) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await findOrCreateCart(userId);

  for (const item of guestCart.items) {
    const product = await getValidatedProduct(item.productId);
    if (!product || product.stockCount <= 0) continue;

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
    });
    const quantity = Math.min(product.stockCount, (existing?.quantity ?? 0) + item.quantity);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      create: { cartId: userCart.id, productId: item.productId, quantity },
      update: { quantity },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
}
