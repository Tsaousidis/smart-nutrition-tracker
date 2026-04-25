"use client";

import { useTranslations } from "next-intl";

const DAYS_PER_WEEK = 7;

type WeeklyTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Targets = {
  dailyCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
};

type Props = {
  totals: WeeklyTotals;
  targets: Targets;
};

export default function WeeklySummary({ totals, targets }: Props) {
  const t = useTranslations("Dashboard");

  const getDiff = (actual: number, weeklyTarget: number) => {
    if (weeklyTarget === 0) return 0;
    return Math.round(((actual - weeklyTarget) / weeklyTarget) * 100);
  };

  const metrics = [
    {
      label: t("calories"),
      actual: totals.calories,
      weeklyTarget: targets.dailyCalories * DAYS_PER_WEEK,
      unit: "kcal",
      diff: getDiff(totals.calories, targets.dailyCalories * DAYS_PER_WEEK),
    },
    {
      label: t("protein"),
      actual: totals.protein,
      weeklyTarget: targets.proteinTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.protein, targets.proteinTarget * DAYS_PER_WEEK),
    },
    {
      label: t("carbs"),
      actual: totals.carbs,
      weeklyTarget: targets.carbsTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.carbs, targets.carbsTarget * DAYS_PER_WEEK),
    },
    {
      label: t("fat"),
      actual: totals.fat,
      weeklyTarget: targets.fatTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.fat, targets.fatTarget * DAYS_PER_WEEK),
    },
  ];

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5 ambient-shadow md:p-6">
      <h3 className="mb-3 font-display text-lg font-semibold text-brand">{t("weeklySummary")}</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className="text-sm text-ink-muted">{metric.label}</div>
            <div className="mt-1 font-display text-xl font-bold text-brand">
              {Math.round(metric.actual).toLocaleString()}
              <span className="text-sm font-normal text-ink-muted">{metric.unit}</span>
            </div>
            <div className="text-xs text-ink-muted">
              {t("weeklyTarget7d")}: {Math.round(metric.weeklyTarget).toLocaleString()}
              {metric.unit}
            </div>
            <div
              className={`mt-1 text-sm font-medium ${
                metric.diff > 10
                  ? "text-red-600"
                  : metric.diff < -10
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {metric.diff > 0 ? "+" : ""}
              {metric.diff}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-center text-sm text-ink-muted">
        {t("last7Days")}
      </div>
    </div>
  );
}
