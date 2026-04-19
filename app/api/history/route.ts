import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

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

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        mealDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        mealDate: "desc",
      },
    });

    const groupedByDay: Record<
      string,
      {
        date: string;
        totals: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
        mealCount: number;
        meals: Array<{
          id: string;
          title: string | null;
          mealDate: Date;
          items: Array<{
            id: string;
            name: string;
            quantity: number;
            unit: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
          }>;
        }>;
      }
    > = {};

    for (const meal of meals) {
      const dayKey = formatDateKey(meal.mealDate);

      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = {
          date: dayKey,
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          mealCount: 0,
          meals: [],
        };
      }

      groupedByDay[dayKey].mealCount += 1;
      groupedByDay[dayKey].meals.push({
        id: meal.id,
        title: meal.title,
        mealDate: meal.mealDate,
        items: meal.items,
      });

      for (const item of meal.items) {
        groupedByDay[dayKey].totals.calories += item.calories;
        groupedByDay[dayKey].totals.protein += item.protein;
        groupedByDay[dayKey].totals.carbs += item.carbs;
        groupedByDay[dayKey].totals.fat += item.fat;
      }
    }

    const days = Object.values(groupedByDay)
      .map((day) => ({
        ...day,
        totals: {
          calories: Math.round(day.totals.calories * 10) / 10,
          protein: Math.round(day.totals.protein * 10) / 10,
          carbs: Math.round(day.totals.carbs * 10) / 10,
          fat: Math.round(day.totals.fat * 10) / 10,
        },
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({
      ok: true,
      message: "History fetched successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        days,
      },
    });
  } catch (error) {
    console.error("History route error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while fetching history",
      },
      { status: 500 }
    );
  }
}