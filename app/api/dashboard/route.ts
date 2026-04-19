import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        goal: true,
      },
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        mealDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        mealDate: "asc",
      },
    });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const meal of meals) {
      for (const item of meal.items) {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
      }
    }

    const targets = {
      dailyCalories: user.goal?.dailyCalories ?? 0,
      proteinTarget: user.goal?.proteinTarget ?? 0,
      carbsTarget: user.goal?.carbsTarget ?? 0,
      fatTarget: user.goal?.fatTarget ?? 0,
    };

    const remaining = {
      calories: Math.round((targets.dailyCalories - totalCalories) * 10) / 10,
      protein: Math.round((targets.proteinTarget - totalProtein) * 10) / 10,
      carbs: Math.round((targets.carbsTarget - totalCarbs) * 10) / 10,
      fat: Math.round((targets.fatTarget - totalFat) * 10) / 10,
    };

    return NextResponse.json({
      ok: true,
      message: "Dashboard data fetched successfully",
      data: {
        date: startOfDay.toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        totals: {
          calories: Math.round(totalCalories * 10) / 10,
          protein: Math.round(totalProtein * 10) / 10,
          carbs: Math.round(totalCarbs * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
        },
        targets,
        remaining,
        meals: meals.map((meal) => ({
          id: meal.id,
          title: meal.title,
          mealDate: meal.mealDate,
          items: meal.items,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard route error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while fetching dashboard data",
      },
      { status: 500 }
    );
  }
}