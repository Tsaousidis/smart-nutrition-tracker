import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendResetEmail } from "@/lib/email";

// Messages based on locale
const messages = {
  en: {
    alreadyRequested: "You have already requested a password reset. Please check your email or spam folder, or try again in 1 hour.",
    success: "If an account exists with this email, a password reset link will be sent",
  },
  el: {
    alreadyRequested: "Έχεις ήδη ζητήσει επαναφορά κωδικού. Παρακαλώ ελέγξε το email σου ή τον φάκελο spam, ή δοκίμασε ξανά σε 1 ώρα.",
    success: "Αν υπάρχει λογαριασμός με αυτό το email, θα σταλεί σύνδεσμος επαναφοράς κωδικού",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, locale = "en" } = body;

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
      // Check if user already has a valid (non-expired) reset token
      if (user.resetToken && user.resetTokenExpires && user.resetTokenExpires > new Date()) {
        const msg = locale === "el" ? messages.el.alreadyRequested : messages.en.alreadyRequested;
        return NextResponse.json({
          ok: true,
          message: msg,
          alreadyRequested: true,
        });
      }

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

      // Send reset email with locale
      await sendResetEmail(email, resetToken, locale);
      
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    // Return same message whether user exists or not
    const successMsg = locale === "el" ? messages.el.success : messages.en.success;
    return NextResponse.json({
      ok: true,
      message: successMsg,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}