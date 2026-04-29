import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import { sanitizeEmail } from "@/lib/sanitize";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit({
      key: `signup:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", message: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const parsedBody = signupSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          errors: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    let email = parsedBody.data.email;
    const password = parsedBody.data.password;
    const locale = parsedBody.data.locale || "en";
    
    // Sanitize email
    try {
      email = sanitizeEmail(email);
    } catch (error) {
      console.error("Email sanitization failed:", error);
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_EMAIL",
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          code: "USER_EXISTS",
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationToken: verificationTokenHash,
        verificationTokenExpires,
      },
    });

    // Send verification email with locale
    await sendVerificationEmail(email, verificationToken, locale);

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "User created successfully. Please check your email to verify your account.",
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup route error:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Something went wrong while creating the user",
      },
      { status: 500 }
    );
  }
}