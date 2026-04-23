import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type HistoryDay = {
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
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
      include: {
        goal: true,
      },
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

    const searchParams = req.nextUrl.searchParams;
    const requestedDate = searchParams.get("date");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let selectedDate = today;

    if (requestedDate) {
      const parsedDate = new Date(`${requestedDate}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_DATE",
            message: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)",
          },
          { status: 400 }
        );
      }
      selectedDate = parsedDate;
    }

    selectedDate.setHours(0, 0, 0, 0);

    const selectedStartDate = new Date(selectedDate);
    const selectedEndDate = new Date(selectedDate);
    selectedEndDate.setHours(23, 59, 59, 999);

    const chartEndDate = new Date();
    chartEndDate.setHours(23, 59, 59, 999);
    const chartStartDate = new Date(chartEndDate);
    chartStartDate.setDate(chartStartDate.getDate() - 6);
    chartStartDate.setHours(0, 0, 0, 0);

    const [chartMeals, selectedMeals] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: user.id,
          mealDate: {
            gte: chartStartDate,
            lte: chartEndDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          mealDate: "asc",
        },
      }),
      prisma.meal.findMany({
        where: {
          userId: user.id,
          mealDate: {
            gte: selectedStartDate,
            lte: selectedEndDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          mealDate: "desc",
        },
      }),
    ]);

    function groupMealsByDay(meals: typeof chartMeals) {
      return meals.reduce<Record<string, HistoryDay>>((acc, meal) => {
        const dayKey = formatDateKey(meal.mealDate);

        if (!acc[dayKey]) {
          acc[dayKey] = {
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

        acc[dayKey].mealCount += 1;
        acc[dayKey].meals.push({
          id: meal.id,
          title: meal.title,
          mealDate: meal.mealDate,
          items: meal.items,
        });

        for (const item of meal.items) {
          acc[dayKey].totals.calories += item.calories;
          acc[dayKey].totals.protein += item.protein;
          acc[dayKey].totals.carbs += item.carbs;
          acc[dayKey].totals.fat += item.fat;
        }

        return acc;
      }, {});
    }

    const chartGroups = groupMealsByDay(chartMeals);
    const selectedGroups = groupMealsByDay(selectedMeals);

    const chartDays: HistoryDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(chartStartDate);
      day.setDate(chartStartDate.getDate() + i);
      const dayKey = formatDateKey(day);

      chartDays.push(
        chartGroups[dayKey] ?? {
          date: dayKey,
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          mealCount: 0,
          meals: [],
        }
      );
    }

    const selectedDay = selectedGroups[formatDateKey(selectedDate)] || null;

    const normalizedChartDays = chartDays.map((day) => ({
      ...day,
      totals: {
        calories: Math.round(day.totals.calories * 10) / 10,
        protein: Math.round(day.totals.protein * 10) / 10,
        carbs: Math.round(day.totals.carbs * 10) / 10,
        fat: Math.round(day.totals.fat * 10) / 10,
      },
    }));

    const normalizedSelectedDay = selectedDay
      ? {
          ...selectedDay,
          totals: {
            calories: Math.round(selectedDay.totals.calories * 10) / 10,
            protein: Math.round(selectedDay.totals.protein * 10) / 10,
            carbs: Math.round(selectedDay.totals.carbs * 10) / 10,
            fat: Math.round(selectedDay.totals.fat * 10) / 10,
          },
        }
      : null;

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "History fetched successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        selectedDate: formatDateKey(selectedDate),
        range: {
          start: selectedStartDate.toISOString(),
          end: selectedEndDate.toISOString(),
        },
        selectedDay: normalizedSelectedDay,
        chartDays: normalizedChartDays,
        goals: {
          dailyCalories: user.goal?.dailyCalories ?? 0,
          proteinTarget: user.goal?.proteinTarget ?? 0,
          carbsTarget: user.goal?.carbsTarget ?? 0,
          fatTarget: user.goal?.fatTarget ?? 0,
        },
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