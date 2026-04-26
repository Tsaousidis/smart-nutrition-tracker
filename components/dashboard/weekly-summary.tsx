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

  const formatNumber = (value: number) => Math.round(value).toLocaleString();

  const metrics = [
    {
      label: t("calories"),
      actual: totals.calories,
      weeklyTarget: targets.dailyCalories * DAYS_PER_WEEK,
      unit: "kcal",
      diff: getDiff(totals.calories, targets.dailyCalories * DAYS_PER_WEEK),
      accent: "bg-emerald-500/15 text-emerald-700",
    },
    {
      label: t("protein"),
      actual: totals.protein,
      weeklyTarget: targets.proteinTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.protein, targets.proteinTarget * DAYS_PER_WEEK),
      accent: "bg-indigo-500/15 text-indigo-700",
    },
    {
      label: t("carbs"),
      actual: totals.carbs,
      weeklyTarget: targets.carbsTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.carbs, targets.carbsTarget * DAYS_PER_WEEK),
      accent: "bg-sky-500/15 text-sky-700",
    },
    {
      label: t("fat"),
      actual: totals.fat,
      weeklyTarget: targets.fatTarget * DAYS_PER_WEEK,
      unit: "g",
      diff: getDiff(totals.fat, targets.fatTarget * DAYS_PER_WEEK),
      accent: "bg-amber-500/15 text-amber-700",
    },
  ];

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5 ambient-shadow md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-brand">{t("weeklySummary")}</h3>
        <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-ink-muted">
          {t("last7Days")}
        </span>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border bg-surface-soft/70 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${metric.accent.split(" ")[0]}`} aria-hidden />
                <p className="text-sm font-semibold text-ink">{metric.label}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  metric.diff > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {metric.diff > 0 ? "+" : ""}
                {metric.diff}%
              </span>
            </div>

            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-2xl font-semibold text-brand">
                {formatNumber(metric.actual)}
                <span className="ml-1 text-sm font-medium text-ink-muted">{metric.unit}</span>
              </p>
              <p className="text-xs text-ink-muted">
                {t("target")}: {formatNumber(metric.weeklyTarget)} {metric.unit}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
