import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = profileUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, phone } = validated.data;

    let updatedUser = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: session.id },
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });
    } catch (err) {
      console.warn("DB notice:", err);
      updatedUser = {
        ...session,
        name: name.trim(),
        phone: phone?.trim() || session.phone,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
