"use client";

import { useTranslations } from "next-intl";

type WeeklyAverages = {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
};

type Targets = {
  dailyCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
};

type Props = {
  averages: WeeklyAverages;
  targets: Targets;
};

export default function WeeklySummary({ averages, targets }: Props) {
  const t = useTranslations("Dashboard");

  const getDiff = (avg: number, target: number) => {
    if (target === 0) return 0;
    return Math.round(((avg - target) / target) * 100);
  };

  const metrics = [
    {
      label: t("calories"),
      avg: averages.avgCalories,
      target: targets.dailyCalories,
      unit: "kcal",
      diff: getDiff(averages.avgCalories, targets.dailyCalories),
    },
    {
      label: t("protein"),
      avg: averages.avgProtein,
      target: targets.proteinTarget,
      unit: "g",
      diff: getDiff(averages.avgProtein, targets.proteinTarget),
    },
    {
      label: t("carbs"),
      avg: averages.avgCarbs,
      target: targets.carbsTarget,
      unit: "g",
      diff: getDiff(averages.avgCarbs, targets.carbsTarget),
    },
    {
      label: t("fat"),
      avg: averages.avgFat,
      target: targets.fatTarget,
      unit: "g",
      diff: getDiff(averages.avgFat, targets.fatTarget),
    },
  ];

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">{t("weeklySummary")}</h3>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className="text-sm text-slate-600">{metric.label}</div>
            <div className="mt-1 text-xl font-bold">
              {Math.round(metric.avg).toLocaleString()}
              <span className="text-sm font-normal">{metric.unit}</span>
            </div>
            <div className="text-xs text-slate-500">
              {t("target")}: {metric.target}{metric.unit}
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

      <div className="mt-3 text-center text-sm text-slate-500">
        {t("last7Days")}
      </div>
    </div>
  );
}