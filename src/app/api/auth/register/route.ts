import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword, createSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { adoptGuestCart } from "@/lib/guestCart";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    const normalizedPhone = phone.trim();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: normalizedPhone }] },
      select: { email: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.email === normalizedEmail
              ? "An account with this email already exists"
              : "An account with this phone number already exists",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    // Create session cookie
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    await adoptGuestCart(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Account registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error occurred while registering account" },
      { status: 500 }
    );
  }
}
