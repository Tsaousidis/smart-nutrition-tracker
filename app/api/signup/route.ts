import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import { sanitizeEmail } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "User created successfully",
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
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}