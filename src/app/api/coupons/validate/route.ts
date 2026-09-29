import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupons";
import { validateCouponSchema } from "@/lib/validations/coupon";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = validateCouponSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Please provide a valid coupon code and subtotal." },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.id;

    const result = await validateCoupon(
      validated.data.code,
      validated.data.subtotal,
      userId
    );

    return NextResponse.json({
      success: true,
      isValid: true,
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discountAmount: result.discountAmount,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        error: error.message || "Failed to validate coupon code.",
      },
      { status: 400 }
    );
  }
}
