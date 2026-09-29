import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCouponById, updateCoupon, deleteCoupon } from "@/lib/coupons";
import { updateCouponSchema } from "@/lib/validations/coupon";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await context.params;
    const result = await getCouponById(id);

    if (!result) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateCouponSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid coupon update input" },
        { status: 400 }
      );
    }

    const updated = await updateCoupon(id, validated.data);
    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await context.params;
    const result = await deleteCoupon(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 400 }
    );
  }
}
