import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsedBody = signupSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request body",
          errors: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
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
        message: "Something went wrong while creating the user",
      },
      { status: 500 }
    );
  }
}