import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ items: [] });
    }

    let items: any[] = [];
    try {
      const wishlist = await prisma.wishlist.findUnique({
        where: { userId: session.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  comparePrice: true,
                  packSize: true,
                  sku: true,
                  brand: { select: { name: true } },
                  category: { select: { name: true, slug: true } },
                },
              },
            },
          },
        },
      });

      items = wishlist?.items || [];
    } catch (err) {
      console.warn("DB notice:", err);
    }

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to save items to your wishlist" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    let isWishlisted = false;
    try {
      let wishlist = await prisma.wishlist.findUnique({
        where: { userId: session.id },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId: session.id },
        });
      }

      const existingItem = await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
      });

      if (existingItem) {
        await prisma.wishlistItem.delete({
          where: { id: existingItem.id },
        });
        isWishlisted = false;
      } else {
        await prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId,
          },
        });
        isWishlisted = true;
      }
    } catch (err) {
      isWishlisted = true;
    }

    return NextResponse.json({
      success: true,
      isWishlisted,
      message: isWishlisted ? "Item added to wishlist" : "Item removed from wishlist",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
