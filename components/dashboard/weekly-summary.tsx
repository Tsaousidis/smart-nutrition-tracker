"use client";

import { useTranslations } from "next-intl";
import { getTargetRange } from "@/lib/calculations";

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

  const getDiff = (actual: number, dailyTarget: number) => {
    const { min, max } = getTargetRange(dailyTarget);
    const weeklyMin = min * DAYS_PER_WEEK;
    const weeklyMax = max * DAYS_PER_WEEK;
    if (actual === 0) return null;
    if (actual < weeklyMin) {
      return { value: Math.round(((weeklyMin - actual) / weeklyMin) * 100), status: "under" };
    }
    if (actual > weeklyMax) {
      return { value: Math.round(((actual - weeklyMax) / weeklyMax) * 100), status: "over" };
    }
    return { value: 0, status: "on-track" };
  };

  const formatNumber = (value: number) => Math.round(value).toLocaleString();

  const metrics = [
    {
      label: t("calories"),
      actual: totals.calories,
      dailyTarget: targets.dailyCalories,
      unit: "kcal",
      diff: getDiff(totals.calories, targets.dailyCalories),
    },
    {
      label: t("protein"),
      actual: totals.protein,
      dailyTarget: targets.proteinTarget,
      unit: "g",
      diff: getDiff(totals.protein, targets.proteinTarget),
    },
    {
      label: t("carbs"),
      actual: totals.carbs,
      dailyTarget: targets.carbsTarget,
      unit: "g",
      diff: getDiff(totals.carbs, targets.carbsTarget),
    },
    {
      label: t("fat"),
      actual: totals.fat,
      dailyTarget: targets.fatTarget,
      unit: "g",
      diff: getDiff(totals.fat, targets.fatTarget),
    },
  ];

  const getDiffBadgeClass = (diff: { value: number; status: string } | null) => {
    if (!diff) return "bg-gray-100 text-gray-500";
    switch (diff.status) {
      case "under":
        return "bg-orange-100 text-orange-700";
      case "over":
        return "bg-red-100 text-red-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  const getDiffLabel = (diff: { value: number; status: string } | null) => {
    if (!diff) return "—";
    if (diff.status === "under") return `-${diff.value}%`;
    if (diff.status === "over") return `+${diff.value}%`;
    return "On track";
  };

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
                <span className={`h-2.5 w-2.5 rounded-full ${
                  metric.diff?.status === "under" ? "bg-orange-500" :
                  metric.diff?.status === "over" ? "bg-red-500" :
                  "bg-emerald-500"
                }`} aria-hidden />
                <p className="text-sm font-semibold text-ink">{metric.label}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getDiffBadgeClass(metric.diff)}`}>
                {getDiffLabel(metric.diff)}
              </span>
            </div>

            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-2xl font-semibold text-brand">
                {formatNumber(metric.actual)}
                <span className="ml-1 text-sm font-medium text-ink-muted">{metric.unit}</span>
              </p>
              <p className="text-xs text-ink-muted">
                {t("target")}: {formatNumber(Math.round(getTargetRange(metric.dailyTarget).min * DAYS_PER_WEEK))} - {formatNumber(Math.round(getTargetRange(metric.dailyTarget).max * DAYS_PER_WEEK))} {metric.unit}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
