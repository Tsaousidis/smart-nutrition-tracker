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

type InsightsTranslations = {
  belowProtein: (value: number) => string;
  aboveProtein: (value: number) => string;
  remainingCalories: (value: number) => string;
  aboveCalories: (value: number) => string;
  onTrack: string;
  mealCount: (count: number) => string;
  avgProteinPerMeal: (value: number) => string;
  proteinTargetPerMeal: (value: number) => string;
  weeklyProteinDiff: (value: number) => string;
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
      insights.push(translations.weeklyProteinDiff(weeklyStats.proteinDiffPercent));
    } else {
      insights.push(translations.weeklyProteinOnTrack);
    }
  }

  // 4. Protein insight (existing)
  if (remaining.protein > 20) {
    insights.push(translations.belowProtein(Math.round(remaining.protein)));
  } else if (remaining.protein < -10) {
    insights.push(translations.aboveProtein(Math.abs(Math.round(remaining.protein))));
  }

  // 5. Calories insight (existing)
  if (remaining.calories > 200) {
    insights.push(translations.remainingCalories(Math.round(remaining.calories)));
  } else if (remaining.calories < -200) {
    insights.push(translations.aboveCalories(Math.abs(Math.round(remaining.calories))));
  }

  // Balanced day (only if no other insights)
  if (insights.length === 0) {
    insights.push(translations.onTrack);
  }

  return insights;
}