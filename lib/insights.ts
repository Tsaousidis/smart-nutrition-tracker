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
};

type InsightsTranslations = {
  belowProtein: (value: number) => string;
  aboveProtein: (value: number) => string;
  remainingCalories: (value: number) => string;
  aboveCalories: (value: number) => string;
  onTrack: string;
};

export function generateInsights(
  data: DashboardData,
  translations: InsightsTranslations
): string[] {
  const insights: string[] = [];

  const { remaining } = data;

  // Protein insight
  if (remaining.protein > 20) {
    insights.push(translations.belowProtein(Math.round(remaining.protein)));
  } else if (remaining.protein < -10) {
    insights.push(translations.aboveProtein(Math.abs(Math.round(remaining.protein))));
  }

  // Calories insight
  if (remaining.calories > 200) {
    insights.push(translations.remainingCalories(Math.round(remaining.calories)));
  } else if (remaining.calories < -200) {
    insights.push(translations.aboveCalories(Math.abs(Math.round(remaining.calories))));
  }

  // Balanced day
  if (insights.length === 0) {
    insights.push(translations.onTrack);
  }

  return insights;
}