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

export function generateInsights(data: DashboardData): string[] {
  const insights: string[] = [];

  const { remaining } = data;

  // Protein insight
  if (remaining.protein > 20) {
    insights.push(
      `You are ${Math.round(remaining.protein)}g below your protein target`
    );
  } else if (remaining.protein < -10) {
    insights.push(
      `You exceeded your protein target by ${Math.abs(
        Math.round(remaining.protein)
      )}g`
    );
  }

  // Calories insight
  if (remaining.calories > 200) {
    insights.push(
      `You still have ${Math.round(remaining.calories)} kcal remaining today`
    );
  } else if (remaining.calories < -200) {
    insights.push(
      `You exceeded your calorie target by ${Math.abs(
        Math.round(remaining.calories)
      )} kcal`
    );
  }

  // Balanced day
  if (insights.length === 0) {
    insights.push("You're on track with your nutrition today");
  }

  return insights;
}