import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit({
      key: `verify-email-confirm:${ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Token is required" },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: tokenHash,
        verificationTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}