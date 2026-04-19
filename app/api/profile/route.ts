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
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const parsedBody = profileSchema.safeParse({
      ...body,
      email: session.user.email,
    });

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
        message: "Something went wrong while saving profile",
      },
      { status: 500 }
    );
  }
}