import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOrder, getUserOrders } from "@/lib/orders";
import { createOrderSchema } from "@/lib/validations/order";

// GET: Retrieve authenticated user's order list
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getUserOrders(session.id);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: Place a new order
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to place an order. Please sign in to continue." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid order details" },
        { status: 400 }
      );
    }

    const order = await createOrder(session.id, validated.data);

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 400 }
    );
  }
}
