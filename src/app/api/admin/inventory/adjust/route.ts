import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adjustStock } from "@/lib/inventory";
import { adjustStockSchema } from "@/lib/validations/inventory";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await adjustStock({
      ...parsed.data,
      performedBy: session.email || session.name || "admin@saadmedicalstore.com",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to adjust stock" },
      { status: 400 }
    );
  }
}
