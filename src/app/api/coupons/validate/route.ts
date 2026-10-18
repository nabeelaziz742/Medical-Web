import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { validateCoupon } from "@/lib/coupons";
import { getUserCart } from "@/lib/cart";
import { GUEST_CART_COOKIE } from "@/lib/guestCart";
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

    // Use the server-side cart subtotal so the discount shown matches what the order will apply
    const cookieStore = await cookies();
    const cartOwner = userId || cookieStore.get(GUEST_CART_COOKIE)?.value;
    const cartSubtotal = cartOwner ? (await getUserCart(cartOwner)).subtotal : 0;
    const subtotal = cartSubtotal > 0 ? cartSubtotal : validated.data.subtotal;

    const result = await validateCoupon(validated.data.code, subtotal, userId);

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
