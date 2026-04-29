import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `verify-email-resend:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        ok: true,
        message: "If this email is not verified, a verification link will be sent",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        ok: true,
        message: "This email is already verified",
      });
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        verificationToken: verificationTokenHash,
        verificationTokenExpires,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      ok: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Verification resend error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}