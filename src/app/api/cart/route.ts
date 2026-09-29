import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import {
  getUserCart,
  addItemToUserCart,
  updateCartItemQuantity,
  removeItemFromUserCart,
  clearUserCart,
} from "@/lib/cart";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "@/lib/validations/cart";

const GUEST_CART_COOKIE = "saad_guest_cart_id";

async function getEffectiveUserId(): Promise<{ userId: string; isGuest: boolean }> {
  const session = await getSession();
  if (session) {
    return { userId: session.id, isGuest: false };
  }

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    cookieStore.set(GUEST_CART_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return { userId: guestId, isGuest: true };
}

// GET: Retrieve current cart
export async function GET() {
  try {
    const { userId } = await getEffectiveUserId();
    const cart = await getUserCart(userId);
    return NextResponse.json({ cart });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST: Add product to cart
export async function POST(req: NextRequest) {
  try {
    const { userId } = await getEffectiveUserId();
    const body = await req.json();
    const validated = addToCartSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { productId, quantity } = validated.data;
    const cart = await addItemToUserCart(userId, productId, quantity);

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add item to cart" },
      { status: 400 }
    );
  }
}

// PATCH: Update item quantity
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await getEffectiveUserId();
    const body = await req.json();
    const validated = updateCartItemSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { productId, quantity } = validated.data;
    const cart = await updateCartItemQuantity(userId, productId, quantity);

    return NextResponse.json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update cart item" },
      { status: 400 }
    );
  }
}

// DELETE: Remove item or clear cart
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getEffectiveUserId();
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clear") === "true";
    const productId = searchParams.get("productId");

    if (clearAll) {
      await clearUserCart(userId);
      const cart = await getUserCart(userId);
      return NextResponse.json({
        success: true,
        message: "Cart cleared",
        cart,
      });
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID or clear parameter required" },
        { status: 400 }
      );
    }

    const cart = await removeItemFromUserCart(userId, productId);
    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove item" },
      { status: 400 }
    );
  }
}
