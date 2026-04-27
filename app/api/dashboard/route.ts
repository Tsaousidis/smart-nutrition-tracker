import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Get timezone from client header (default to UTC if not provided)
    const userTimezone = request.headers.get("x-user-timezone") || "UTC";

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

    // Calculate start/end of day based on user's timezone
    const now = new Date();
    const userOffset = getTimezoneOffset(userTimezone, now);
    
    // Create dates in user's local timezone
    const startOfDay = new Date(now.getTime() - userOffset);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now.getTime() - userOffset);
    endOfDay.setUTCHours(23, 59, 59, 999);

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

    // Get chart data - from first meal date to today
    const firstMeal = await prisma.meal.findFirst({
      where: { userId: user.id },
      orderBy: { mealDate: "asc" },
      take: 1,
    });

    let chartStartDate: Date;
    if (firstMeal) {
      chartStartDate = new Date(firstMeal.mealDate);
      chartStartDate.setHours(0, 0, 0, 0);
    } else {
      chartStartDate = new Date();
      chartStartDate.setDate(chartStartDate.getDate() - 6);
      chartStartDate.setHours(0, 0, 0, 0);
    }

    const chartEndDate = new Date();
    chartEndDate.setHours(23, 59, 59, 999);

    const chartMeals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        mealDate: {
          gte: chartStartDate,
          lte: chartEndDate,
        },
      },
      include: { items: true },
      orderBy: { mealDate: "asc" },
    });

    // Group meals by day
    const chartGroups = chartMeals.reduce<Record<string, { calories: number; protein: number; fat: number }>>((acc, meal) => {
      const dayKey = meal.mealDate.toISOString().slice(0, 10);
      if (!acc[dayKey]) {
        acc[dayKey] = { calories: 0, protein: 0, fat: 0 };
      }
      for (const item of meal.items) {
        acc[dayKey].calories += item.calories;
        acc[dayKey].protein += item.protein;
        acc[dayKey].fat += item.fat;
      }
      return acc;
    }, {});

    // Generate chart days
    const chartData: Array<{ date: string; calories: number; protein: number; fat: number }> = [];
    const currentDate = new Date(chartStartDate);
    const today = new Date();
    while (currentDate <= today) {
      const dayKey = currentDate.toISOString().slice(0, 10);
      const day = dayKey.slice(8, 10) + "/" + dayKey.slice(5, 7);
      chartData.push({
        date: day,
        calories: Math.round((chartGroups[dayKey]?.calories ?? 0) * 10) / 10,
        protein: Math.round((chartGroups[dayKey]?.protein ?? 0) * 10) / 10,
        fat: Math.round((chartGroups[dayKey]?.fat ?? 0) * 10) / 10,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly protein stats (last 7 days)
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 6);
    weekStartDate.setHours(0, 0, 0, 0);

    const weekMeals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        mealDate: {
          gte: weekStartDate,
          lte: chartEndDate,
        },
      },
      include: { items: true },
    });

    let weekTotalCalories = 0;
    let weekTotalProtein = 0;
    let weekTotalCarbs = 0;
    let weekTotalFat = 0;
    let weekDaysWithMeals = 0;
    const weekDaysSet = new Set<string>();

    for (const meal of weekMeals) {
      const dayKey = meal.mealDate.toISOString().slice(0, 10);
      if (!weekDaysSet.has(dayKey)) {
        weekDaysSet.add(dayKey);
        weekDaysWithMeals++;
      }
      for (const item of meal.items) {
        weekTotalCalories += item.calories;
        weekTotalProtein += item.protein;
        weekTotalCarbs += item.carbs;
        weekTotalFat += item.fat;
      }
    }

    const avgDailyProtein = weekDaysWithMeals > 0 ? weekTotalProtein / weekDaysWithMeals : 0;
    const dailyProteinTarget = targets.proteinTarget;
    const proteinDiffPercent = dailyProteinTarget > 0 
      ? Math.round(((avgDailyProtein - dailyProteinTarget) / dailyProteinTarget) * 100)
      : 0;

    const weeklyMacroDistribution = {
      carbs: Math.round(weekTotalCarbs * 10) / 10,
      protein: Math.round(weekTotalProtein * 10) / 10,
      fat: Math.round(weekTotalFat * 10) / 10,
    };

    const weeklyTotals = {
      calories: Math.round(weekTotalCalories * 10) / 10,
      protein: Math.round(weekTotalProtein * 10) / 10,
      carbs: Math.round(weekTotalCarbs * 10) / 10,
      fat: Math.round(weekTotalFat * 10) / 10,
    };

    // Average intake per active day (last 7 days window)
    const daysWithData = weekDaysSet.size || 1;
    const weeklyAverages = {
      avgCalories: Math.round((weekTotalCalories / daysWithData) * 10) / 10,
      avgProtein: Math.round((weekTotalProtein / daysWithData) * 10) / 10,
      avgCarbs: Math.round((weekTotalCarbs / daysWithData) * 10) / 10,
      avgFat: Math.round((weekTotalFat / daysWithData) * 10) / 10,
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
        chartData,
        weeklyStats: {
          avgDailyProtein: Math.round(avgDailyProtein * 10) / 10,
          proteinDiffPercent,
          daysWithMeals: weekDaysWithMeals,
        },
        weeklyMacroDistribution,
        weeklyTotals,
        weeklyAverages,
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