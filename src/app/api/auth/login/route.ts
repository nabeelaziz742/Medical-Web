import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { comparePassword, createSession, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Default store owner admin credential for bootstrap initialization
const ADMIN_EMAIL = "admin@saadmedicalstore.com";
const ADMIN_DEFAULT_PASS = "admin123";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { emailOrPhone, password, rememberMe } = validated.data;
    const input = emailOrPhone.toLowerCase().trim();

    // Check for bootstrap Store Admin
    if (input === ADMIN_EMAIL && password === ADMIN_DEFAULT_PASS) {
      const adminUser = {
        id: "admin-saad-owner",
        name: "Store Owner / Admin",
        email: ADMIN_EMAIL,
        phone: "03364085027",
        role: "ADMIN" as const,
      };

      await createSession(adminUser, Boolean(rememberMe));

      return NextResponse.json({
        success: true,
        message: "Admin authenticated successfully",
        user: adminUser,
      });
    }

    // Lookup user by email or phone
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: input }, { phone: input }],
        },
      });
    } catch (dbErr) {
      console.warn("DB lookup notice:", dbErr);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    await createSession(sessionUser, Boolean(rememberMe));

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: sessionUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error occurred during login" },
      { status: 500 }
    );
  }
}
