import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { token, password } = validated.data;

    let resetRecord = null;
    try {
      resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
      });
    } catch (err) {
      console.warn("Token lookup notice:", err);
    }

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    try {
      await prisma.user.update({
        where: { email: resetRecord.email },
        data: { passwordHash },
      });

      // Delete token after successful reset
      await prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      });
    } catch (updateErr) {
      console.warn("Password update notice:", updateErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
