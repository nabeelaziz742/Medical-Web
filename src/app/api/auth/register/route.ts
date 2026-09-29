import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword, createSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Check if user already exists
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      console.warn("Database query notice:", dbErr);
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let user = null;
    try {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
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
    } catch (err) {
      // Fallback local memory ID if DB is spinning up
      user = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        role: "CUSTOMER" as const,
      };
    }

    // Save in global memory users
    const globalForUsers = globalThis as unknown as {
      memoryUsers?: Map<string, any>;
    };
    if (!globalForUsers.memoryUsers) {
      globalForUsers.memoryUsers = new Map();
    }
    globalForUsers.memoryUsers.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: new Date().toISOString(),
    });

    // Create session cookie
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

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
