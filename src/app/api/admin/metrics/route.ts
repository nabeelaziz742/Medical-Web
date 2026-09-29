import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDashboardMetrics } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const metrics = await getAdminDashboardMetrics();
    return NextResponse.json({ success: true, ...metrics });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin metrics" },
      { status: 500 }
    );
  }
}
