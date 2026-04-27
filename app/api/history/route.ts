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

    // Get timezone from client header (default to UTC if not provided)
    const userTimezone = req.headers.get("x-user-timezone") || "UTC";

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

    // Calculate today's date based on user's timezone
    const now = new Date();
    const userOffset = getTimezoneOffset(userTimezone, now);
    
    const today = new Date(now.getTime() - userOffset);
    today.setUTCHours(0, 0, 0, 0);

    let selectedDate = new Date(today);

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

    selectedDate.setUTCHours(0, 0, 0, 0);

    const selectedStartDate = new Date(selectedDate);
    const selectedEndDate = new Date(selectedDate);
    selectedEndDate.setUTCHours(23, 59, 59, 999);

    // Find the first meal date for this user to set as chart start
    const firstMeal = await prisma.meal.findFirst({
      where: { userId: user.id },
      orderBy: { mealDate: "asc" },
      take: 1,
    });

    const chartEndDate = new Date(now.getTime() - userOffset);
    chartEndDate.setUTCHours(23, 59, 59, 999);

    let chartStartDate: Date;
    if (firstMeal) {
      // Start from the first meal date
      chartStartDate = new Date(firstMeal.mealDate);
      chartStartDate.setUTCHours(0, 0, 0, 0);
    } else {
      // Default to 7 days if no meals exist
      chartStartDate = new Date(chartEndDate);
      chartStartDate.setDate(chartStartDate.getDate() - 6);
      chartStartDate.setUTCHours(0, 0, 0, 0);
    }

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

    // Generate chart days from first meal date to today
    const chartDays: HistoryDay[] = [];
    const endDate = new Date(now.getTime() - userOffset);
    endDate.setUTCHours(23, 59, 59, 999);
    
    const currentDate = new Date(chartStartDate);
    while (currentDate <= endDate) {
      const dayKey = formatDateKey(currentDate);
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
      currentDate.setDate(currentDate.getDate() + 1);
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
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate timezone offset in milliseconds
function getTimezoneOffset(timezone: string, date: Date): number {
  // Common timezone offsets in milliseconds (UTC offset)
  const timezoneOffsets: Record<string, number> = {
    "Europe/Athens": 3 * 60 * 60 * 1000,     // UTC+3
    "Europe/London": 0,                        // UTC+0
    "Europe/Berlin": 1 * 60 * 60 * 1000,       // UTC+1
    "Europe/Paris": 1 * 60 * 60 * 1000,        // UTC+1
    "America/New_York": -5 * 60 * 60 * 1000,   // UTC-5
    "America/Los_Angeles": -8 * 60 * 60 * 1000,// UTC-8
    "America/Chicago": -6 * 60 * 60 * 1000,    // UTC-6
    "UTC": 0,
  };

  // Try to match the timezone string
  for (const [tz, offset] of Object.entries(timezoneOffsets)) {
    if (timezone.includes(tz.split("/")[1] || tz)) {
      return offset;
    }
  }

  // Try to parse numeric offset (e.g., "+03:00" or "03:00")
  const match = timezone.match(/([+-])?(\d{1,2}):?(\d{2})?/);
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2] || "0", 10);
    const minutes = parseInt(match[3] || "0", 10);
    return sign * (hours * 60 + minutes) * 60 * 1000;
  }

  // Default to UTC
  return 0;
}