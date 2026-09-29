import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInventoryDashboardMetrics } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const metrics = await getInventoryDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory metrics" },
      { status: 500 }
    );
  }
}
