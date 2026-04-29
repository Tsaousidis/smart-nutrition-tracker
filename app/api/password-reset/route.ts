import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Same user-facing message in all cases to avoid email / account enumeration
const messages = {
  en: "If an account exists with this email, a password reset link will be sent.",
  el: "Αν υπάρχει λογαριασμός με αυτό το email, θα σταλεί σύνδεσμος επαναφοράς κωδικού.",
};

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `password-reset:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

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

    if (user) {
      const hasPendingReset =
        user.resetToken &&
        user.resetTokenExpires &&
        user.resetTokenExpires > new Date();

      // If no pending reset, issue a new token and email; if pending, do nothing (no extra email, no leak)
      if (!hasPendingReset) {
        const resetToken = randomBytes(32).toString("hex");
        const resetTokenHash = createHash("sha256").update(resetToken).digest("hex");

        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

        await prisma.user.update({
          where: { email },
          data: {
            resetToken: resetTokenHash,
            resetTokenExpires,
          },
        });

        await sendResetEmail(email, resetToken, locale);
      }
    }

    const successMsg = locale === "el" ? messages.el : messages.en;
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