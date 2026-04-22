import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateMacroTargets } from "@/lib/calculations";
import { profileSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const parsedBody = profileSchema.safeParse(
      body && typeof body === "object"
        ? { ...body, email: session.user.email }
        : { email: session.user.email }
    );

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

    const { email, sex, age, heightCm, weightKg, activityLevel, goalType } =
      parsedBody.data;

    const targets = calculateMacroTargets(
      {
        sex,
        age,
        heightCm,
        weightKg,
        activityLevel,
      },
      goalType
    );

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "USER_NOT_FOUND",
          message: "Authenticated user not found",
        },
        { status: 404 }
      );
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        sex,
        age,
        heightCm,
        weightKg,
        activityLevel,
      },
      create: {
        userId: user.id,
        sex,
        age,
        heightCm,
        weightKg,
        activityLevel,
      },
    });

    const goal = await prisma.goal.upsert({
      where: { userId: user.id },
      update: {
        goalType,
        dailyCalories: targets.dailyCalories,
        proteinTarget: targets.proteinTarget,
        carbsTarget: targets.carbsTarget,
        fatTarget: targets.fatTarget,
      },
      create: {
        userId: user.id,
        goalType,
        dailyCalories: targets.dailyCalories,
        proteinTarget: targets.proteinTarget,
        carbsTarget: targets.carbsTarget,
        fatTarget: targets.fatTarget,
      },
    });

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "Profile and goal saved successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        goal,
      },
    });
  } catch (error) {
    console.error("Profile route error:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Something went wrong while saving profile",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}