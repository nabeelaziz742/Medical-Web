import { cookies } from "next/headers";
import { mergeGuestCartIntoUser } from "@/lib/cart";

export const GUEST_CART_COOKIE = "saad_guest_cart_id";

/**
 * After a customer signs in or registers, move whatever they added as a guest into their
 * account cart and drop the guest cookie, so checkout shows exactly what will be ordered.
 */
export async function adoptGuestCart(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestId) return;

  try {
    await mergeGuestCartIntoUser(guestId, userId);
  } catch (err) {
    console.error("Failed to merge guest cart:", err);
  }
  cookieStore.delete(GUEST_CART_COOKIE);
}
