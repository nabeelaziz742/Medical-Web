import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { comparePassword, createSession, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { adoptGuestCart } from "@/lib/guestCart";

/**
 * Creates the store owner account in the database the first time they sign in, using
 * ADMIN_EMAIL / ADMIN_PASSWORD from the environment. After that the password lives only
 * as a bcrypt hash in the users table, like every other account.
 */
async function ensureBootstrapAdmin(input: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || input !== adminEmail || password !== adminPassword) return;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name: "Store Owner / Admin",
      email: adminEmail,
      phone: null,
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
    },
  });
}

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

    await ensureBootstrapAdmin(input, password);

    // Lookup user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input }, { phone: input }],
      },
    });

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
    await adoptGuestCart(user.id);

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
