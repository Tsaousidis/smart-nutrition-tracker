import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
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

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        verificationToken,
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