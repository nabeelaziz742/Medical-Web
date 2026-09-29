import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInventoryProducts } from "@/lib/inventory";
import { inventoryQuerySchema } from "@/lib/validations/inventory";

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
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || "all",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 15,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const parsed = inventoryQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await getInventoryProducts(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
