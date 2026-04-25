import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit({
      key: `password-reset-confirm:${ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Hash the token to compare with database
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const hashedPassword = await hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}