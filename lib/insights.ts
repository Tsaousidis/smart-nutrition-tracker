type DashboardData = {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    dailyCalories: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
  };
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealCount: number;
  weeklyStats?: {
    avgDailyProtein: number;
    proteinDiffPercent: number;
    daysWithMeals: number;
  };
};

import { isWithinTargetRange, getTargetRange } from "./calculations";

type InsightsTranslations = {
  belowProtein: (value: number) => string;
  aboveProtein: (value: number) => string;
  remainingCalories: (value: number) => string;
  aboveCalories: (value: number) => string;
  onTrack: string;
  mealCount: (count: number) => string;
  avgProteinPerMeal: (value: number) => string;
  proteinTargetPerMeal: (value: number) => string;
  weeklyProteinDiff: (value: number, options?: { direction: string }) => string;
  weeklyProteinOnTrack: string;
};

export function generateInsights(
  data: DashboardData,
  translations: InsightsTranslations
): string[] {
  const insights: string[] = [];

  const { remaining, mealCount, weeklyStats } = data;

  // 1. Meal count insight
  if (mealCount < 3) {
    insights.push(translations.mealCount(mealCount));
  }

  // 2. Average protein per meal (if meals exist)
  if (mealCount > 0 && data.totals.protein > 0) {
    const avgProteinPerMeal = data.totals.protein / mealCount;
    insights.push(translations.avgProteinPerMeal(Math.round(avgProteinPerMeal)));
    
    // Protein per meal target check (suggest 25g+ per meal for good distribution)
    if (avgProteinPerMeal < 25) {
      insights.push(translations.proteinTargetPerMeal(25));
    }
  }

  // 3. Weekly protein trend (only if at least 4 days with data)
  if (weeklyStats && weeklyStats.daysWithMeals >= 4) {
    if (Math.abs(weeklyStats.proteinDiffPercent) > 15) {
      const direction = weeklyStats.proteinDiffPercent > 0 ? "above" : "below";
      insights.push(translations.weeklyProteinDiff(Math.abs(weeklyStats.proteinDiffPercent), { direction }));
    } else {
      insights.push(translations.weeklyProteinOnTrack);
    }
  }

  // 4. Protein insight (existing) - use ±10% tolerance
  const proteinRange = getTargetRange(data.targets.proteinTarget);
  if (data.totals.protein < proteinRange.min - 20) {
    insights.push(translations.belowProtein(Math.round(proteinRange.min - data.totals.protein)));
  } else if (data.totals.protein > proteinRange.max + 10) {
    insights.push(translations.aboveProtein(Math.round(data.totals.protein - proteinRange.max)));
  }

  // 5. Calories insight - use ±10% tolerance
  const calorieRange = getTargetRange(data.targets.dailyCalories);
  if (data.totals.calories < calorieRange.min - 200) {
    insights.push(translations.remainingCalories(Math.round(calorieRange.min - data.totals.calories)));
  } else if (data.totals.calories > calorieRange.max + 200) {
    insights.push(translations.aboveCalories(Math.round(data.totals.calories - calorieRange.max)));
  }

  // Balanced day (only if no other insights)
  if (insights.length === 0) {
    insights.push(translations.onTrack);
  }

  return insights;
}