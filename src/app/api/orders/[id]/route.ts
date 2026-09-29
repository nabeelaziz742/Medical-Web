import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Access control: Only owner or admin can view order
    if (session.role !== "ADMIN" && (!order.userId || order.userId !== session.id)) {
      return NextResponse.json(
        { error: "Access denied. You cannot view orders placed by other accounts." },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve order" },
      { status: 500 }
    );
  }
}
