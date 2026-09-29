import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInventoryLedger } from "@/lib/inventory";
import { transactionQuerySchema } from "@/lib/validations/inventory";

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

    const { searchParams } = new URL(request.url);
    const rawParams = {
      productId: searchParams.get("productId") || undefined,
      batchId: searchParams.get("batchId") || undefined,
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    };

    const parsed = transactionQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await getInventoryLedger(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock transactions ledger" },
      { status: 500 }
    );
  }
}
