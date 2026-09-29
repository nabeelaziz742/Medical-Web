import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBatchDetail } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
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

    const { batchId } = await params;
    const detail = await getBatchDetail(batchId);

    if (!detail) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch batch details" },
      { status: 500 }
    );
  }
}
