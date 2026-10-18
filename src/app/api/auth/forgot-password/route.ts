import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { hashResetToken } from "@/lib/auth";
import { isEmailConfigured, sendEmail } from "@/lib/email";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

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
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // Only a hash is stored, so a leaked database cannot be used to reset passwords
      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token: hashResetToken(token),
          expiresAt,
        },
      });

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
      const resetLink = `${siteUrl}/reset-password?token=${token}`;

      if (isEmailConfigured()) {
        try {
          await sendEmail({
            to: normalizedEmail,
            subject: "Reset your SAAD Medical Store password",
            text: `Assalam o Alaikum ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${resetLink}\n\nIf you did not ask for this, you can ignore this email.\n\nSAAD Medical Store`,
            html: `<p>Assalam o Alaikum ${escapeHtml(user.name)},</p><p>Use the button below to set a new password. The link is valid for 1 hour.</p><p><a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none">Reset password</a></p><p>If you did not ask for this, you can ignore this email.</p><p>SAAD Medical Store</p>`,
          });
        } catch (mailErr) {
          console.error("Password reset email failed:", mailErr);
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.info(`[dev] Password reset link for ${normalizedEmail}: ${resetLink}`);
      } else {
        console.error("Password reset requested but RESEND_API_KEY / EMAIL_FROM are not set");
      }
    }

    // Always return a positive message to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we have emailed a password reset link. Please check your inbox (and spam folder).",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
