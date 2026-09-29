import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProductInventoryDetail } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const { productId } = await params;
    const detail = await getProductInventoryDetail(productId);

    if (!detail) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch product inventory" },
      { status: 500 }
    );
  }
}
