import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getSalesReport,
  getOrderReport,
  getProductPerformanceReport,
  getInventoryReport,
  getCouponReport,
  DateRangeFilter,
  DateRangePreset,
} from "@/lib/reports";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales";
    const preset = (searchParams.get("range") || "LAST_30_DAYS") as DateRangePreset;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter: DateRangeFilter = {
      preset,
      startDate,
      endDate,
    };

    let reportData: any = null;

    switch (type) {
      case "sales":
        reportData = await getSalesReport(filter);
        break;
      case "orders":
        reportData = await getOrderReport(filter);
        break;
      case "products":
        reportData = await getProductPerformanceReport(filter);
        break;
      case "inventory":
        reportData = await getInventoryReport(filter);
        break;
      case "coupons":
        reportData = await getCouponReport(filter);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown report type "${type}". Supported types: sales, orders, products, inventory, coupons.` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type,
      ...reportData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
