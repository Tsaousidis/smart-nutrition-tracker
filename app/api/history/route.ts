import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    // Parse pagination parameters
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "7")));

    // Parse custom date range or use default (last N days)
    let startDate = new Date();
    let endDate = new Date();

    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    if (customStartDate) {
      try {
        startDate = new Date(customStartDate);
      } catch {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_DATE",
            message: "Invalid startDate format. Use ISO 8601 (YYYY-MM-DD)",
          },
          { status: 400 }
        );
      }
    } else {
      startDate.setDate(startDate.getDate() - (limit - 1));
    }

    if (customEndDate) {
      try {
        endDate = new Date(customEndDate);
      } catch {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_DATE",
            message: "Invalid endDate format. Use ISO 8601 (YYYY-MM-DD)",
          },
          { status: 400 }
        );
      }
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

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
      code: "SUCCESS",
      message: "History fetched successfully",
      pagination: {
        page,
        limit,
        total: Object.keys(groupedByDay).length,
      },
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
        code: "INTERNAL_ERROR",
        message: "Something went wrong while fetching history",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}