import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendResetEmail } from "@/lib/email";

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

    // Always return success to prevent email enumeration
    // But actually process if user exists
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenHash = createHash("sha256").update(resetToken).digest("hex");
      
      // Set expiry (1 hour)
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

      // Save token to database
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpires,
        },
      });

      // Send reset email (or log for development)
      await sendResetEmail(email, resetToken);
      
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    // Return same message whether user exists or not
    return NextResponse.json({
      ok: true,
      message: "If an account exists with this email, a password reset link will be sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}