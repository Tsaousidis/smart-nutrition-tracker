import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { ok: false, message: "Password is required" },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify password
    const { compare } = await import("bcryptjs");
    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { ok: false, message: "Incorrect password" },
        { status: 400 }
      );
    }

    // Use a transaction to guarantee all-or-nothing deletion.
    // Related rows are removed by Prisma relations with onDelete: Cascade.
    await prisma.$transaction([
      prisma.user.delete({
        where: { id: user.id },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}