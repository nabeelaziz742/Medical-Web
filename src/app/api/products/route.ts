import { NextResponse } from "next/server";
import { getStorefrontProducts } from "@/lib/productStore";

export const dynamic = "force-dynamic";

// Public storefront catalog: live prices and stock from the database
export async function GET() {
  const products = await getStorefrontProducts();
  return NextResponse.json({ products });
}
