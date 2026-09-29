import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateReportCSV, DateRangeFilter, DateRangePreset } from "@/lib/reports";

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
    const type = (searchParams.get("type") || "sales") as "sales" | "orders" | "products" | "inventory" | "coupons";
    const preset = (searchParams.get("range") || "LAST_30_DAYS") as DateRangePreset;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter: DateRangeFilter = {
      preset,
      startDate,
      endDate,
    };

    const csvContent = await generateReportCSV(type, filter);
    const filename = `saad_medical_${type}_report_${preset.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export report" },
      { status: 500 }
    );
  }
}
