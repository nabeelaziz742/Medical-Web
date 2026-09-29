import prisma from "@/lib/prisma";
import { getUserCart, clearUserCart, getValidatedProduct, getDeliveryFeeConfig } from "@/lib/cart";
import { CreateOrderInput } from "@/lib/validations/order";
import { planFEFOAllocation, deductMemoryFEFOStock, BatchAllocation } from "@/lib/inventory";
import { validateCoupon, recordCouponUsage } from "@/lib/coupons";

export interface PopulatedOrderItemAllocation {
  id?: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
}

export interface PopulatedOrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  batchId?: string | null;
  allocations?: PopulatedOrderItemAllocation[];
  product?: {
    slug?: string;
    packSize?: string;
    brand?: string;
    image?: string;
  };
}

export interface PopulatedOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryMethod: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "CASH_ON_DELIVERY" | "DIRECT_BANK_TRANSFER";
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string | null;
  couponId?: string | null;
  total: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: PopulatedOrderItem[];
}

// Global in-memory fallback orders map for development persistence when DB is unavailable
const globalForOrders = globalThis as unknown as {
  memoryOrders?: Map<string, PopulatedOrder>;
};

export const memoryOrders =
  globalForOrders.memoryOrders || new Map<string, PopulatedOrder>();

if (process.env.NODE_ENV !== "production") {
  globalForOrders.memoryOrders = memoryOrders;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SM-2026-${timestamp}${random}`.slice(0, 16);
}

export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<PopulatedOrder> {
  // 1. Fetch user's cart
  const cart = await getUserCart(userId);

  if (cart.items.length === 0) {
    throw new Error("Your cart is empty. Please add items before placing an order.");
  }

  // 2. Re-validate all products and plan FEFO stock allocations
  let calculatedSubtotal = 0;
  const orderItemsData: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    packSize?: string;
    brand?: string;
    slug?: string;
    allocations: BatchAllocation[];
  }[] = [];

  for (const item of cart.items) {
    const validatedProduct = await getValidatedProduct(item.productId);
    if (!validatedProduct) {
      throw new Error(`Product "${item.product.name}" is no longer available.`);
    }

    if (validatedProduct.stockStatus === "OUT_OF_STOCK") {
      throw new Error(`Product "${validatedProduct.name}" is currently out of stock.`);
    }

    const price = validatedProduct.price;
    const quantity = Math.max(1, item.quantity);
    const lineTotal = price * quantity;
    calculatedSubtotal += lineTotal;

    // FEFO Allocation check
    const allocations = await planFEFOAllocation(validatedProduct.id, quantity);

    orderItemsData.push({
      productId: validatedProduct.id,
      productName: validatedProduct.name,
      unitPrice: price,
      quantity,
      subtotal: lineTotal,
      packSize: validatedProduct.packSize,
      brand: validatedProduct.brand,
      slug: validatedProduct.slug,
      allocations,
    });
  }

  // 3. Validate & Apply Coupon if provided
  let discount = 0;
  let appliedCouponId: string | null = null;
  let appliedCouponCode: string | null = null;

  if (input.couponCode && input.couponCode.trim()) {
    const couponValidation = await validateCoupon(
      input.couponCode,
      calculatedSubtotal,
      userId
    );
    discount = couponValidation.discountAmount;
    appliedCouponId = couponValidation.coupon.id;
    appliedCouponCode = couponValidation.coupon.code;
  }

  const feeConfig = getDeliveryFeeConfig(calculatedSubtotal);
  const deliveryFee = feeConfig.deliveryFee;
  const grandTotal = Math.max(0, calculatedSubtotal + deliveryFee - discount);
  const orderNumber = generateOrderNumber();

  let createdOrder: PopulatedOrder | null = null;

  try {
    const dbOrder = await prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          customerEmail: input.customerEmail?.trim() || null,
          shippingAddressId: input.shippingAddressId || null,
          deliveryAddress: input.deliveryAddress.trim(),
          deliveryMethod: "HOME_DELIVERY",
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: input.paymentMethod,
          subtotal: calculatedSubtotal,
          deliveryFee,
          discount,
          couponCode: appliedCouponCode,
          couponId: appliedCouponId,
          total: grandTotal,
          internalNotes: input.internalNotes?.trim() || null,
        },
      });

      // 2. Record coupon usage atomically
      if (appliedCouponId) {
        await recordCouponUsage(tx, appliedCouponId, order.id, userId, discount);
      }

      // 3. Create OrderItems, OrderItemAllocations, and deduct batch stock atomically
      const createdItems = [];
      for (const itemData of orderItemsData) {
        const primaryBatchId = itemData.allocations[0]?.batchId || null;

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: itemData.productId,
            productName: itemData.productName,
            unitPrice: itemData.unitPrice,
            quantity: itemData.quantity,
            subtotal: itemData.subtotal,
            batchId: primaryBatchId,
            allocations: {
              create: itemData.allocations.map((a) => ({
                batchId: a.batchId,
                quantity: a.quantity,
              })),
            },
          },
          include: {
            allocations: true,
          },
        });

        // Deduct stock for each allocation and create SALE transaction
        for (const alloc of itemData.allocations) {
          const updatedBatch = await tx.batch.update({
            where: { id: alloc.batchId },
            data: {
              quantity: { decrement: alloc.quantity },
            },
          });

          await tx.inventory.updateMany({
            where: { productId: itemData.productId },
            data: {
              totalStock: { decrement: alloc.quantity },
            },
          });

          await tx.stockTransaction.create({
            data: {
              productId: itemData.productId,
              batchId: alloc.batchId,
              type: "SALE",
              quantity: -alloc.quantity,
              balanceAfter: updatedBatch.quantity,
              referenceId: orderNumber,
              performedBy: userId || "CUSTOMER_CHECKOUT",
              notes: `Order ${orderNumber} - Item: ${itemData.productName} (${alloc.quantity} units from batch ${alloc.batchNumber})`,
            },
          });
        }

        createdItems.push(orderItem);
      }

      // 3. Clear the user's cart in DB
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return {
        ...order,
        items: createdItems,
      };
    });

    createdOrder = {
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
      items: dbOrder.items.map((i) => {
        const matchingProduct = orderItemsData.find((d) => d.productId === i.productId);
        return {
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
          batchId: i.batchId,
          allocations: matchingProduct?.allocations.map((a) => ({
            batchId: a.batchId,
            batchNumber: a.batchNumber,
            quantity: a.quantity,
          })),
          product: matchingProduct ? {
            slug: matchingProduct.slug,
            packSize: matchingProduct.packSize,
            brand: matchingProduct.brand,
          } : undefined,
        };
      }),
    };
  } catch (err: any) {
    // If error was thrown from insufficient stock or validation, rethrow it
    if (err.message && (err.message.includes("Insufficient") || err.message.includes("out of stock") || err.message.includes("empty"))) {
      throw err;
    }

    // Memory fallback order
    const orderId = `ord-${Date.now()}`;

    // Deduct stock in memory
    const memoryAllocationsToDeduct: Array<{ productId: string; batchId: string; quantity: number }> = [];
    orderItemsData.forEach((item) => {
      item.allocations.forEach((a) => {
        memoryAllocationsToDeduct.push({
          productId: item.productId,
          batchId: a.batchId,
          quantity: a.quantity,
        });
      });
    });
    deductMemoryFEFOStock(memoryAllocationsToDeduct, orderNumber, userId || "CUSTOMER_CHECKOUT");

    // Record coupon usage in memory
    if (appliedCouponId) {
      await recordCouponUsage(null, appliedCouponId, orderId, userId, discount);
    }

    createdOrder = {
      id: orderId,
      orderNumber,
      userId,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      deliveryAddress: input.deliveryAddress.trim(),
      deliveryMethod: "HOME_DELIVERY",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: input.paymentMethod,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discount,
      couponCode: appliedCouponCode,
      couponId: appliedCouponId,
      total: grandTotal,
      internalNotes: input.internalNotes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItemsData.map((d, index) => ({
        id: `item-${orderId}-${index}`,
        productId: d.productId,
        productName: d.productName,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        subtotal: d.subtotal,
        batchId: d.allocations[0]?.batchId || null,
        allocations: d.allocations.map((a) => ({
          batchId: a.batchId,
          batchNumber: a.batchNumber,
          quantity: a.quantity,
        })),
        product: {
          slug: d.slug,
          packSize: d.packSize,
          brand: d.brand,
        },
      })),
    };
  }

  // Always save in memory map as well
  if (createdOrder) {
    memoryOrders.set(createdOrder.id, createdOrder);
    memoryOrders.set(createdOrder.orderNumber, createdOrder);
  }

  // Clear memory cart
  await clearUserCart(userId);

  return createdOrder!;
}

export async function getUserOrders(userId: string): Promise<PopulatedOrder[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
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

  const userMemoryOrders = Array.from(memoryOrders.values()).filter(
    (o, idx, arr) => o.userId === userId && arr.findIndex((x) => x.id === o.id) === idx
  );

  return userMemoryOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(orderIdOrNumber: string, userId?: string): Promise<PopulatedOrder | null> {
  try {
    const dbOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        items: true,
      },
    });

    if (dbOrder) {
      // Authorization Check
      if (userId && dbOrder.userId && dbOrder.userId !== userId) {
        return null; // Not authorized
      }

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

  const memoryOrder = memoryOrders.get(orderIdOrNumber);
  if (!memoryOrder) return null;

  if (userId && memoryOrder.userId && memoryOrder.userId !== userId) {
    return null;
  }

  return memoryOrder;
}
