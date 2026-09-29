import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (err) {
      console.warn("DB notice:", err);
    }

    return NextResponse.json({
      user: user || session,
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
