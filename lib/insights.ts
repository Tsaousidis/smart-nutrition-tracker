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
  belowProtein: string;
  aboveProtein: string;
  remainingCalories: string;
  aboveCalories: string;
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
    insights.push(
      translations.belowProtein.replace("{value}", Math.round(remaining.protein).toString())
    );
  } else if (remaining.protein < -10) {
    insights.push(
      translations.aboveProtein.replace("{value}", Math.abs(Math.round(remaining.protein)).toString())
    );
  }

  // Calories insight
  if (remaining.calories > 200) {
    insights.push(
      translations.remainingCalories.replace("{value}", Math.round(remaining.calories).toString())
    );
  } else if (remaining.calories < -200) {
    insights.push(
      translations.aboveCalories.replace("{value}", Math.abs(Math.round(remaining.calories)).toString())
    );
  }

  // Balanced day
  if (insights.length === 0) {
    insights.push(translations.onTrack);
  }

  return insights;
}