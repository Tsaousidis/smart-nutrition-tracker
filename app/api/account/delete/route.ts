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

    // Delete all related data first (cascade)
    // Delete meals and their items
    const meals = await prisma.meal.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    for (const meal of meals) {
      await prisma.mealItem.deleteMany({
        where: { mealId: meal.id },
      });
    }

    await prisma.meal.deleteMany({
      where: { userId: user.id },
    });

    // Delete profile and goal
    await prisma.profile.deleteMany({
      where: { userId: user.id },
    });

    await prisma.goal.deleteMany({
      where: { userId: user.id },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: user.id },
    });

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