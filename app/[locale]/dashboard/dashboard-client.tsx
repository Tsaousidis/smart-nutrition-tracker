"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Insights from "@/components/dashboard/insights";
import SingleMetricChart from "@/components/charts/single-metric-chart";
import MacroDonutChart from "@/components/charts/macro-donut-chart";
import WeeklySummary from "@/components/dashboard/weekly-summary";
import { generateInsights } from "@/lib/insights";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type DashboardResponse = {
  ok: boolean;
  message: string;
  data?: {
    date: string;
    user: {
      id: string;
      email: string;
    };
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
    meals: Array<{
      id: string;
      title: string | null;
      mealDate: string;
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>;
    }>;
    chartData: Array<{
      date: string;
      calories: number;
      protein: number;
      fat: number;
    }>;
    weeklyStats?: {
      avgDailyProtein: number;
      proteinDiffPercent: number;
      daysWithMeals: number;
    };
    weeklyMacroDistribution?: {
      carbs: number;
      protein: number;
      fat: number;
    };
    weeklyTotals?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    weeklyAverages?: {
      avgCalories: number;
      avgProtein: number;
      avgCarbs: number;
      avgFat: number;
    };
  };
};

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Dashboard");
  const [dashboardData, setDashboardData] =
    useState<DashboardResponse["data"] | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's timezone and send as header
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/dashboard", {
        headers: {
          "x-user-timezone": userTimezone,
        },
      });
      const data: DashboardResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || t("loadError"));
      }

      setDashboardData(data.data || null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : t("unknownLoadError")
      );
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const insights = useMemo(() => {
    if (!dashboardData) return [];
    return generateInsights(
      {
        totals: dashboardData.totals,
        targets: dashboardData.targets,
        remaining: dashboardData.remaining,
        mealCount: dashboardData.meals?.length || 0,
        weeklyStats: dashboardData.weeklyStats,
      },
      {
        belowProtein: (value) => t("belowProtein", { value }),
        aboveProtein: (value) => t("aboveProtein", { value }),
        remainingCalories: (value) => t("remainingCalories", { value }),
        aboveCalories: (value) => t("aboveCalories", { value }),
        onTrack: t("onTrack"),
        mealCount: (count) => t("mealCount", { count }),
        avgProteinPerMeal: (value) => t("avgProteinPerMeal", { value }),
        proteinTargetPerMeal: (value) => t("proteinTargetPerMeal", { value }),
        weeklyProteinDiff: (value) => t("weeklyProteinDiff", { value }),
        weeklyProteinOnTrack: t("weeklyProteinOnTrack"),
      }
    );
  }, [dashboardData, t]);

  const metrics = useMemo(() => {
    if (!dashboardData) return null;
    const caloriePct =
      dashboardData.targets.dailyCalories > 0
        ? Math.max(0, (dashboardData.totals.calories / dashboardData.targets.dailyCalories) * 100)
        : 0;
    const isOverCalories = dashboardData.totals.calories > dashboardData.targets.dailyCalories;
    const proteinPct =
      dashboardData.targets.proteinTarget > 0
        ? Math.min(
            100,
            Math.max(0, (dashboardData.totals.protein / dashboardData.targets.proteinTarget) * 100)
          )
        : 0;

    const todayMeals = dashboardData.meals?.length ?? 0;
    const chartData = dashboardData.chartData ?? [];
    const last7 = chartData.slice(-7);
    const todayIdx = chartData.length - 1;
    const ydayIdx = chartData.length - 2;
    const todayCalories = todayIdx >= 0 ? chartData[todayIdx].calories : 0;
    const ydayCalories = ydayIdx >= 0 ? chartData[ydayIdx].calories : 0;
    const hasYesterdayMeal = ydayCalories > 0;
    const trendPct = hasYesterdayMeal && ydayCalories > 0 ? ((todayCalories - ydayCalories) / ydayCalories) * 100 : null;

    const daysWithData = last7.filter((d) => d.calories > 0).length;
    const daysWithinTarget = last7.filter((d) => d.calories > 0 && d.calories <= dashboardData.targets.dailyCalories).length;
    const completionRate = daysWithData > 0 ? Math.round((daysWithinTarget / daysWithData) * 100) : 0;

    let currentStreak = 0;
    for (let i = chartData.length - 1; i >= 0; i -= 1) {
      if (chartData[i].calories > 0) currentStreak += 1;
      else break;
    }

    let bestStreak = 0;
    let run = 0;
    for (const day of chartData) {
      if (day.calories > 0) {
        run += 1;
        if (run > bestStreak) bestStreak = run;
      } else {
        run = 0;
      }
    }

    const elapsedDays = Math.max(1, last7.filter((d) => d.calories > 0).length);
    const projectedWeeklyCalories = (dashboardData.weeklyTotals?.calories ?? 0) / elapsedDays * 7;
    const weeklyTargetCalories = dashboardData.targets.dailyCalories * 7;
    const projectedOutcome = weeklyTargetCalories > 0 ? Math.round((projectedWeeklyCalories / weeklyTargetCalories) * 100) : 0;

    const topInsights = insights.slice(0, 3);
    const motivationLine = t("projectedWeeklyOutcome", { value: projectedOutcome });

    let nextAction = t("reviewWeeklyPlan");
    let nextActionHref = "/history";
    if (dashboardData.remaining.protein > 25) {
      nextAction = t("addProteinSnack");
      nextActionHref = "/meals";
    } else if (todayMeals < 3) {
      nextAction = t("logDinnerNow");
      nextActionHref = "/meals";
    }

    return {
      caloriePct,
      proteinPct,
      isOverCalories,
      todayMeals,
      hasYesterdayMeal,
      trendPct,
      daysWithinTarget,
      completionRate,
      currentStreak,
      bestStreak,
      projectedOutcome,
      topInsights,
      motivationLine,
      nextAction,
      nextActionHref,
      last7,
      daysWithData,
    };
  }, [dashboardData, insights, t]);

  return (
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-[1152px]">
        <div className="mb-8 rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold text-brand">{t("title")}</h1>
              <p className="mt-2 text-sm text-ink-muted">{t("subtitle")}</p>
            </div>
            <Link href="/meals" className="btn-brand inline-flex shrink-0">
              {t("logMeal")}
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">{t("errorLabel")}</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={loadDashboard}
                className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                {t("retry")}
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-xl border border-border bg-surface-soft" />
            ))}
          </div>
        ) : null}

        {!loading &&
        !error &&
        !dashboardData ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center ambient-shadow">
            <h2 className="font-display text-xl font-semibold text-brand">{t("emptyStateTitle")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("emptyStateSubtitle")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/meals" className="btn-brand inline-flex">
                {t("logFirstMeal")}
              </Link>
              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-surface-soft"
              >
                {t("retry")}
              </button>
            </div>
          </div>
        ) : null}

        {!loading &&
        !error &&
        dashboardData &&
        (dashboardData.meals.length === 0 || dashboardData.chartData.every((d) => d.calories <= 0)) ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center ambient-shadow">
            <h2 className="font-display text-xl font-semibold text-brand">{t("emptyStateTitle")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("emptyStateSubtitle")}</p>
            <Link href="/meals" className="btn-brand mt-5 inline-flex">
              {t("logFirstMeal")}
            </Link>
          </div>
        ) : null}

        {dashboardData && metrics && (
          <div className="space-y-8">
            {/* Responsive grid for main stats */}
            <section className="grid gap-x-6 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
              {/* Κουτάκια με ίσο ύψος και πλήρες πλάτος */}
              <div className="h-full min-h-[170px] rounded-xl border border-border bg-surface p-6 ambient-shadow flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{t("todayStatus")}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-brand">
                  {metrics.isOverCalories
                    ? t("overCalories", { value: Math.round(metrics.caloriePct) })
                    : t("onTrackPercent", { value: Math.round(metrics.caloriePct) })}
                </h2>
                {metrics.hasYesterdayMeal && metrics.trendPct !== null && metrics.todayMeals > 0 ? (
                  <span className="mt-3 inline-block rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald-800">
                    {t("fromYesterday", {
                      value: `${metrics.trendPct >= 0 ? "+" : ""}${Math.round(metrics.trendPct)}%`,
                    })}
                  </span>
                ) : null}
              </div>

              <div className="h-full min-h-[170px] rounded-xl border border-border bg-surface p-5 ambient-shadow flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{t("caloriesLeft")}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-brand">
                    {Math.max(0, Math.round(dashboardData.remaining.calories))}
                  </span>
                  <span className="text-sm font-medium text-ink-muted">kcal</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${Math.min(100, Math.max(0, (dashboardData.totals.calories / dashboardData.targets.dailyCalories) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="h-full min-h-[170px] rounded-xl border border-border bg-surface p-5 ambient-shadow flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{t("proteinProgress")}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-brand">
                    {Math.round(dashboardData.totals.protein)}
                  </span>
                  <span className="text-sm font-medium text-ink-muted">/ {Math.round(dashboardData.targets.proteinTarget)} g</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, Math.max(0, (dashboardData.totals.protein / dashboardData.targets.proteinTarget) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="h-full min-h-[170px] rounded-xl border border-border bg-surface p-5 ambient-shadow flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{t("mealsToday")}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-brand">{metrics.todayMeals}</span>
                  <span className="text-sm font-medium text-ink-muted">
                    {metrics.todayMeals === 1 ? t("meals") : t("mealsPlural")}
                  </span>
                </div>
                <div className="mt-3 flex justify-center gap-1">
                  {[...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-6 rounded-full ${
                        idx < metrics.todayMeals ? "bg-emerald-500" : "bg-surface-soft"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {metrics.todayMeals > 0 && (
              <section className="rounded-xl border border-border bg-emerald-soft/70 px-5 py-3 text-sm text-ink ambient-shadow">
                {metrics.motivationLine}
              </section>
            )}

            {/* Responsive grid για macro progress και insights */}
            <section className="grid gap-x-6 gap-y-6 grid-cols-1 lg:grid-cols-3 min-w-0 items-stretch">
              <div className="h-full min-h-0 rounded-xl border border-border bg-surface p-6 ambient-shadow flex flex-col lg:col-span-2">
                <h3 className="font-display text-xl font-semibold text-brand">{t("macroProgress")}</h3>
                <div className="mt-5 space-y-5">
                  {[
                    { label: t("protein"), value: dashboardData.totals.protein, target: dashboardData.targets.proteinTarget },
                    { label: t("carbs"), value: dashboardData.totals.carbs, target: dashboardData.targets.carbsTarget },
                    { label: t("fat"), value: dashboardData.totals.fat, target: dashboardData.targets.fatTarget },
                  ].map((macro) => {
                    const pct = macro.target > 0 ? (macro.value / macro.target) * 100 : 0;
                    const status =
                      pct < 85 ? t("statusLow") : pct > 115 ? t("statusHigh") : t("statusOnTrack");
                    const barColor =
                      pct < 85 ? "bg-amber-500" : pct > 115 ? "bg-red-500" : "bg-emerald-600";

                    return (
                      <div key={macro.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-ink">{macro.label}</span>
                          <span className="text-ink-muted">
                            {Math.round(macro.value)} / {Math.round(macro.target)} {t("target")}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-soft">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">{status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-full min-h-0 flex flex-col">
                <Insights insights={metrics.topInsights} />
              </div>
            </section>

            {dashboardData.chartData && dashboardData.chartData.length > 0 && (
              <div className="space-y-6">
                {/* Responsive grid για charts και στατιστικά */}
                <section className="grid gap-x-6 gap-y-6 grid-cols-1 lg:grid-cols-3 items-stretch">
                  <div className="flex h-full min-h-0 flex-col justify-between gap-6 lg:col-span-2">
                    <div className="flex flex-col justify-between gap-6 rounded-xl border border-border bg-surface p-5 ambient-shadow h-full min-h-0">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-brand">{t("weeklyConsistency")}</h3>
                        <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-ink-muted">
                          {t("daysWithinCaloriesTarget", { value: metrics.daysWithinTarget })} ({metrics.daysWithData})
                        </span>
                      </div>
                      <div className="flex flex-col gap-4 h-full min-h-0">
                        <SingleMetricChart
                          data={dashboardData.chartData.map((d) => ({ date: d.date, value: d.calories }))}
                          target={dashboardData.targets.dailyCalories}
                          title={t("calories")}
                          unit="kcal"
                          color="#003527"
                          targetColor="#ef4444"
                        />
                        <SingleMetricChart
                          data={dashboardData.chartData.map((d) => ({ date: d.date, value: d.protein }))}
                          target={dashboardData.targets.proteinTarget}
                          title={t("protein")}
                          unit="g"
                          color="#6366f1"
                          targetColor="#10b981"
                        />
                        <SingleMetricChart
                          data={dashboardData.chartData.map((d) => ({ date: d.date, value: d.fat }))}
                          target={dashboardData.targets.fatTarget}
                          title={t("fat")}
                          unit="g"
                          color="#f59e0b"
                          targetColor="#ef4444"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="min-h-[180px] rounded-xl border border-border bg-surface p-5 ambient-shadow flex flex-col">
                      <h3 className="font-display text-lg font-semibold text-brand">{t("streakHabits")}</h3>
                      <div className="mt-4 space-y-3 text-sm">
                        <p className="flex items-center justify-between">
                          <span className="text-ink-muted">{t("currentStreak")}</span>
                          <span className="font-display text-xl font-semibold text-brand">{metrics.currentStreak}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-ink-muted">{t("bestStreak")}</span>
                          <span className="font-display text-xl font-semibold text-brand">{metrics.bestStreak}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-ink-muted">{t("completionRate")}</span>
                          <span className="font-display text-xl font-semibold text-brand">{metrics.completionRate}%</span>
                        </p>
                      </div>
                    </div>

                    {dashboardData.weeklyTotals && (
                      <div className="h-full min-h-0 flex flex-col">
                        <WeeklySummary totals={dashboardData.weeklyTotals} targets={dashboardData.targets} />
                      </div>
                    )}

                    {dashboardData.weeklyMacroDistribution && (
                      <div className="h-full min-h-0 flex flex-col">
                        <MacroDonutChart data={dashboardData.weeklyMacroDistribution} title={t("macroDistribution")} />
                      </div>
                    )}
                  </div>
                </section>

                {/* Responsive grid για recent meals και goal momentum */}
                <section className="grid gap-x-6 gap-y-6 grid-cols-1 lg:grid-cols-3 items-stretch">
                  <div className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-border bg-surface p-6 ambient-shadow lg:col-span-2">
                    <h3 className="font-display text-lg font-semibold text-brand">{t("recentMeals")}</h3>
                    <div className="mt-4 space-y-3">
                      {dashboardData.meals.slice(0, 4).map((meal) => {
                        const mealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
                        return (
                          <div key={meal.id} className="rounded-lg border border-border bg-surface-soft px-4 py-3">
                            <p className="font-medium text-ink">{meal.title || t("untitledMeal")}</p>
                            <p className="text-sm text-ink-muted">
                              {new Date(meal.mealDate).toLocaleTimeString([], { 
                                hour: "2-digit", 
                                minute: "2-digit",
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                              })} -{" "}
                              {Math.round(mealCalories)} kcal
                            </p>
                          </div>
                        );
                      })}
                      {dashboardData.meals.length === 0 ? (
                        <p className="text-sm text-ink-muted">{t("mealCount", { count: 0 })}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-6 ambient-shadow">
                    <h3 className="font-display text-lg font-semibold text-brand">{t("goalMomentum")}</h3>
                    <p className="mt-3 text-sm text-ink-muted">
                      {t("projectedWeeklyOutcome", { value: metrics.projectedOutcome })}
                    </p>

                    <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-soft p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{t("nextBestAction")}</p>
                      <p className="mt-1 text-sm font-medium text-ink">{metrics.nextAction}</p>
                      <Link href={metrics.nextActionHref} className="btn-brand mt-4 inline-flex">
                        {t("logMeal")}
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="fixed inset-x-0 bottom-4 z-40 px-6 lg:hidden">
              <Link href={metrics.nextActionHref} className="btn-brand-lg flex w-full items-center justify-center">
                {metrics.nextAction}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}