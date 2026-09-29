import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid email format" },
        { status: 400 }
      );
    }

    const { email } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check user existence quietly (do not expose existence in message)
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (err) {
      console.warn("DB notice:", err);
    }

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      try {
        await prisma.passwordResetToken.create({
          data: {
            email: normalizedEmail,
            token,
            expiresAt,
          },
        });
      } catch (tokenErr) {
        console.warn("Token save notice:", tokenErr);
      }
    }

    // Always return a positive message to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been generated.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
