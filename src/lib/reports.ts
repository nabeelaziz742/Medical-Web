import prisma from "@/lib/prisma";
import { memoryOrders, PopulatedOrder } from "@/lib/orders";
import { memoryStockTransactions, StockTransactionItem } from "@/lib/inventory";
import { memoryCoupons, memoryCouponUsages, PopulatedCoupon, calculateCouponStatus } from "@/lib/coupons";
import { memoryProducts } from "@/lib/admin";
import { CATALOG_PRODUCTS } from "@/data/products";

export type DateRangePreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

export interface DateRangeFilter {
  preset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

/**
 * Compute UTC start and end Date objects for a date preset
 */
export function resolveDateRange(filter?: DateRangeFilter): { start: Date; end: Date; label: string } {
  const now = new Date();
  const preset = filter?.preset || "LAST_30_DAYS";

  if (preset === "CUSTOM" && filter?.startDate && filter?.endDate) {
    const start = new Date(filter.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`,
    };
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "TODAY":
      return { start, end, label: "Today" };

    case "YESTERDAY": {
      start.setDate(start.getDate() - 1);
      const yesterdayEnd = new Date(start);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start, end: yesterdayEnd, label: "Yesterday" };
    }

    case "LAST_7_DAYS":
      start.setDate(start.getDate() - 6);
      return { start, end, label: "Last 7 Days" };

    case "LAST_30_DAYS":
      start.setDate(start.getDate() - 29);
      return { start, end, label: "Last 30 Days" };

    case "THIS_MONTH":
      start.setDate(1);
      return { start, end, label: "This Month" };

    case "LAST_MONTH": {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      const lastMonthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end: lastMonthEnd, label: "Last Month" };
    }

    default:
      start.setDate(start.getDate() - 29);
      return { start, end, label: "Last 30 Days" };
  }
}

/**
 * Fetch all orders within the date range (DB with memory fallback)
 */
async function getOrdersInRange(start: Date, end: Date): Promise<PopulatedOrder[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
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
        couponCode: o.couponCode,
        couponId: o.couponId,
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
    // Memory fallback
  }

  const allMemory = Array.from(
    new Map(Array.from(memoryOrders.values()).map((o) => [o.id, o])).values()
  );

  return allMemory.filter((o) => {
    const d = new Date(o.createdAt).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });
}

/**
 * Fetch stock transactions within the date range
 */
async function getTransactionsInRange(start: Date, end: Date): Promise<StockTransactionItem[]> {
  try {
    const dbTxs = await prisma.stockTransaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        product: { select: { name: true, sku: true } },
        batch: { select: { batchNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbTxs && dbTxs.length > 0) {
      return dbTxs.map((t) => ({
        id: t.id,
        productId: t.productId,
        productName: t.product.name,
        productSku: t.product.sku,
        batchId: t.batchId,
        batchNumber: t.batch?.batchNumber || null,
        type: t.type as StockTransactionItem["type"],
        quantity: t.quantity,
        balanceAfter: t.balanceAfter,
        referenceId: t.referenceId,
        performedBy: t.performedBy,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    // Memory fallback
  }

  const allTxs = memoryStockTransactions || [];
  return allTxs.filter((t) => {
    const d = new Date(t.createdAt).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });
}

// -------------------------------------------------------------
// 1. SALES REPORT
// -------------------------------------------------------------
export async function getSalesReport(filter?: DateRangeFilter) {
  const { start, end, label } = resolveDateRange(filter);
  const orders = await getOrdersInRange(start, end);

  const totalOrders = orders.length;
  let grossSales = 0;
  let totalDiscounts = 0;
  let totalDeliveryFees = 0;
  let netSales = 0;

  let paidOrdersCount = 0;
  let paidOrdersValue = 0;
  let pendingPaymentsCount = 0;
  let pendingPaymentsValue = 0;
  let cancelledOrdersCount = 0;
  let cancelledOrdersValue = 0;

  // Timeline daily points
  const dailyMap: Record<string, { date: string; orders: number; gross: number; discounts: number; net: number }> = {};

  orders.forEach((o) => {
    grossSales += o.subtotal;
    totalDiscounts += o.discount;
    totalDeliveryFees += o.deliveryFee;
    netSales += o.total;

    if (o.paymentStatus === "PAID") {
      paidOrdersCount += 1;
      paidOrdersValue += o.total;
    } else if (o.status === "CANCELLED" || o.status === "REFUNDED") {
      cancelledOrdersCount += 1;
      cancelledOrdersValue += o.total;
    } else {
      pendingPaymentsCount += 1;
      pendingPaymentsValue += o.total;
    }

    const dayKey = o.createdAt.split("T")[0];
    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = { date: dayKey, orders: 0, gross: 0, discounts: 0, net: 0 };
    }
    dailyMap[dayKey].orders += 1;
    dailyMap[dayKey].gross += o.subtotal;
    dailyMap[dayKey].discounts += o.discount;
    dailyMap[dayKey].net += o.total;
  });

  const dailyTimeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary: {
      totalOrders,
      grossSales,
      totalDiscounts,
      totalDeliveryFees,
      netSales,
      averageOrderValue: totalOrders > 0 ? Math.round(netSales / totalOrders) : 0,
    },
    breakdown: {
      paid: { count: paidOrdersCount, amount: paidOrdersValue },
      pending: { count: pendingPaymentsCount, amount: pendingPaymentsValue },
      cancelled: { count: cancelledOrdersCount, amount: cancelledOrdersValue },
    },
    timeline: dailyTimeline,
  };
}

// -------------------------------------------------------------
// 2. ORDER REPORT
// -------------------------------------------------------------
export async function getOrderReport(filter?: DateRangeFilter) {
  const { start, end, label } = resolveDateRange(filter);
  const orders = await getOrdersInRange(start, end);

  const statusCounts: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    PREPARING: 0,
    DISPATCHED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  };

  const paymentMethodCounts: Record<string, { count: number; amount: number }> = {
    CASH_ON_DELIVERY: { count: 0, amount: 0 },
    DIRECT_BANK_TRANSFER: { count: 0, amount: 0 },
  };

  const paymentStatusCounts: Record<string, { count: number; amount: number }> = {
    PENDING: { count: 0, amount: 0 },
    PAID: { count: 0, amount: 0 },
    FAILED: { count: 0, amount: 0 },
    REFUNDED: { count: 0, amount: 0 },
  };

  orders.forEach((o) => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status] += 1;
    }

    if (paymentMethodCounts[o.paymentMethod]) {
      paymentMethodCounts[o.paymentMethod].count += 1;
      paymentMethodCounts[o.paymentMethod].amount += o.total;
    }

    if (paymentStatusCounts[o.paymentStatus]) {
      paymentStatusCounts[o.paymentStatus].count += 1;
      paymentStatusCounts[o.paymentStatus].amount += o.total;
    }
  });

  return {
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    totalOrders: orders.length,
    averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0,
    byStatus: statusCounts,
    byPaymentMethod: paymentMethodCounts,
    byPaymentStatus: paymentStatusCounts,
  };
}

// -------------------------------------------------------------
// 3. PRODUCT PERFORMANCE REPORT
// -------------------------------------------------------------
export async function getProductPerformanceReport(filter?: DateRangeFilter) {
  const { start, end, label } = resolveDateRange(filter);
  const orders = await getOrdersInRange(start, end);

  const productMap: Record<
    string,
    {
      productId: string;
      name: string;
      unitsSold: number;
      ordersCount: number;
      revenue: number;
      category?: string;
    }
  > = {};

  const categoryMap: Record<string, { category: string; unitsSold: number; revenue: number }> = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productMap[item.productId]) {
        // Find product detail
        const catalogProd = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
        productMap[item.productId] = {
          productId: item.productId,
          name: item.productName,
          unitsSold: 0,
          ordersCount: 0,
          revenue: 0,
          category: catalogProd?.category || "General Medicine",
        };
      }

      productMap[item.productId].unitsSold += item.quantity;
      productMap[item.productId].ordersCount += 1;
      productMap[item.productId].revenue += item.subtotal;

      const cat = productMap[item.productId].category || "General Medicine";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, unitsSold: 0, revenue: 0 };
      }
      categoryMap[cat].unitsSold += item.quantity;
      categoryMap[cat].revenue += item.subtotal;
    });
  });

  const productsList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
  const categoryList = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

  return {
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    topProducts: productsList,
    categories: categoryList,
    totalUnitsSold: productsList.reduce((s, p) => s + p.unitsSold, 0),
    totalProductRevenue: productsList.reduce((s, p) => s + p.revenue, 0),
  };
}

// -------------------------------------------------------------
// 4. INVENTORY REPORT
// -------------------------------------------------------------
export async function getInventoryReport(filter?: DateRangeFilter) {
  const { start, end, label } = resolveDateRange(filter);
  const transactions = await getTransactionsInRange(start, end);

  let purchasesUnits = 0;
  let purchasesCount = 0;
  let salesUnits = 0;
  let salesCount = 0;
  let damageUnits = 0;
  let damageCount = 0;
  let expiredUnits = 0;
  let expiredCount = 0;
  let adjustmentUnits = 0;
  let adjustmentCount = 0;
  let returnUnits = 0;
  let returnCount = 0;

  transactions.forEach((t) => {
    const qty = Math.abs(t.quantity);
    switch (t.type) {
      case "PURCHASE":
        purchasesUnits += qty;
        purchasesCount += 1;
        break;
      case "SALE":
        salesUnits += qty;
        salesCount += 1;
        break;
      case "DAMAGE":
        damageUnits += qty;
        damageCount += 1;
        break;
      case "EXPIRED":
      case "EXPIRED_DISPOSAL":
        expiredUnits += qty;
        expiredCount += 1;
        break;
      case "ADJUSTMENT_IN":
      case "ADJUSTMENT_OUT":
      case "ADJUSTMENT":
      case "CORRECTION":
        adjustmentUnits += qty;
        adjustmentCount += 1;
        break;
      case "RETURN":
        returnUnits += qty;
        returnCount += 1;
        break;
    }
  });

  return {
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    ledgerSummary: {
      totalMovements: transactions.length,
      purchases: { units: purchasesUnits, transactions: purchasesCount },
      sales: { units: salesUnits, transactions: salesCount },
      damage: { units: damageUnits, transactions: damageCount },
      expired: { units: expiredUnits, transactions: expiredCount },
      adjustments: { units: adjustmentUnits, transactions: adjustmentCount },
      returns: { units: returnUnits, transactions: returnCount },
    },
    recentTransactions: transactions.slice(0, 50),
  };
}

// -------------------------------------------------------------
// 5. COUPON REPORT
// -------------------------------------------------------------
export async function getCouponReport(filter?: DateRangeFilter) {
  const { start, end, label } = resolveDateRange(filter);
  const orders = await getOrdersInRange(start, end);

  // Group orders with coupons
  const couponMap: Record<
    string,
    {
      code: string;
      discountType: string;
      usageCountInRange: number;
      totalDiscountsGiven: number;
      totalOrderValueGenerated: number;
      status: string;
    }
  > = {};

  orders.forEach((o) => {
    if (o.couponCode) {
      const code = o.couponCode.toUpperCase();
      if (!couponMap[code]) {
        const found = Array.from(memoryCoupons.values()).find((c) => c.code === code);
        couponMap[code] = {
          code,
          discountType: found?.discountType || "PERCENTAGE",
          usageCountInRange: 0,
          totalDiscountsGiven: 0,
          totalOrderValueGenerated: 0,
          status: found ? calculateCouponStatus(found) : "ACTIVE",
        };
      }

      couponMap[code].usageCountInRange += 1;
      couponMap[code].totalDiscountsGiven += o.discount;
      couponMap[code].totalOrderValueGenerated += o.total;
    }
  });

  const couponList = Object.values(couponMap).sort((a, b) => b.totalDiscountsGiven - a.totalDiscountsGiven);

  return {
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary: {
      couponsUsedCount: couponList.length,
      totalDiscountGranted: couponList.reduce((s, c) => s + c.totalDiscountsGiven, 0),
      totalRevenueWithCoupons: couponList.reduce((s, c) => s + c.totalOrderValueGenerated, 0),
    },
    coupons: couponList,
  };
}

// -------------------------------------------------------------
// 6. CSV EXPORT GENERATOR
// -------------------------------------------------------------
export async function generateReportCSV(
  type: "sales" | "orders" | "products" | "inventory" | "coupons",
  filter?: DateRangeFilter
): Promise<string> {
  const clean = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

  switch (type) {
    case "sales": {
      const report = await getSalesReport(filter);
      const headers = ["Date", "Orders Count", "Gross Sales (Rs.)", "Discounts (Rs.)", "Net Sales (Rs.)"];
      const rows = report.timeline.map((d) => [
        clean(d.date),
        clean(d.orders),
        clean(d.gross),
        clean(d.discounts),
        clean(d.net),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    case "orders": {
      const { start, end } = resolveDateRange(filter);
      const orders = await getOrdersInRange(start, end);
      const headers = [
        "Order #",
        "Date",
        "Customer Name",
        "Phone",
        "Status",
        "Payment Method",
        "Payment Status",
        "Subtotal",
        "Delivery Fee",
        "Discount",
        "Coupon Code",
        "Total",
      ];
      const rows = orders.map((o) => [
        clean(o.orderNumber),
        clean(o.createdAt),
        clean(o.customerName),
        clean(o.customerPhone),
        clean(o.status),
        clean(o.paymentMethod),
        clean(o.paymentStatus),
        clean(o.subtotal),
        clean(o.deliveryFee),
        clean(o.discount),
        clean(o.couponCode || ""),
        clean(o.total),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    case "products": {
      const report = await getProductPerformanceReport(filter);
      const headers = ["Product Name", "Category", "Units Sold", "Orders Count", "Revenue Generated (Rs.)"];
      const rows = report.topProducts.map((p) => [
        clean(p.name),
        clean(p.category),
        clean(p.unitsSold),
        clean(p.ordersCount),
        clean(p.revenue),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    case "inventory": {
      const { start, end } = resolveDateRange(filter);
      const txs = await getTransactionsInRange(start, end);
      const headers = [
        "Date",
        "Product Name",
        "SKU",
        "Batch #",
        "Type",
        "Quantity",
        "Balance After",
        "Reference",
        "Performed By",
        "Notes",
      ];
      const rows = txs.map((t) => [
        clean(t.createdAt),
        clean(t.productName),
        clean(t.productSku || ""),
        clean(t.batchNumber || ""),
        clean(t.type),
        clean(t.quantity),
        clean(t.balanceAfter ?? ""),
        clean(t.referenceId || ""),
        clean(t.performedBy || ""),
        clean(t.notes || ""),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    case "coupons": {
      const report = await getCouponReport(filter);
      const headers = [
        "Coupon Code",
        "Discount Type",
        "Uses in Range",
        "Total Discount Given (Rs.)",
        "Order Value Generated (Rs.)",
        "Status",
      ];
      const rows = report.coupons.map((c) => [
        clean(c.code),
        clean(c.discountType),
        clean(c.usageCountInRange),
        clean(c.totalDiscountsGiven),
        clean(c.totalOrderValueGenerated),
        clean(c.status),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    default:
      return "No data";
  }
}
