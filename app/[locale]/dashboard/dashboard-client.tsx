"use client";

import { useEffect, useState } from "react";
import Insights from "@/components/dashboard/insights";
import SingleMetricChart from "@/components/charts/single-metric-chart";
import MacroDonutChart from "@/components/charts/macro-donut-chart";
import WeeklySummary from "@/components/dashboard/weekly-summary";
import { generateInsights } from "@/lib/insights";
import {useTranslations} from "next-intl";

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

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard");
      const data: DashboardResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }

      setDashboardData(data.data || null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unknown dashboard fetch error"
      );
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const insights = dashboardData
  ? generateInsights({
      totals: dashboardData.totals,
      targets: dashboardData.targets,
      remaining: dashboardData.remaining,
      mealCount: dashboardData.meals?.length || 0,
      weeklyStats: dashboardData.weeklyStats,
    }, {
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
    })
  : [];

  return (
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-[1152px]">
        <div className="mb-8 rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-brand">{t("title")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("subtitle")}</p>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        {dashboardData && (
          <div className="space-y-8">
            <Insights insights={insights} />

            {dashboardData.chartData && dashboardData.chartData.length > 0 && (
              <div className="space-y-6">
                {/* Weekly Summary */}
                {dashboardData.weeklyTotals && (
                  <WeeklySummary
                    totals={dashboardData.weeklyTotals}
                    targets={dashboardData.targets}
                  />
                )}

                {/* Macro Distribution + Charts side by side on large screens */}
                <div className="grid min-w-0 gap-6 lg:grid-cols-3">
                  {/* Macro Donut Chart */}
                  {dashboardData.weeklyMacroDistribution && (
                    <div className="min-w-0 lg:col-span-1">
                      <MacroDonutChart 
                        data={dashboardData.weeklyMacroDistribution}
                        title={t("macroDistribution")}
                      />
                    </div>
                  )}

                  {/* Line Charts */}
                  <div
                    className={`min-w-0 ${dashboardData.weeklyMacroDistribution ? "lg:col-span-2" : "lg:col-span-3"}`}
                  >
                    <div className="min-w-0 space-y-4">
                      <SingleMetricChart
                        data={dashboardData.chartData.map(d => ({ date: d.date, value: d.calories }))}
                        target={dashboardData.targets.dailyCalories}
                        title={t("calories")}
                        unit="kcal"
                        color="#000000"
                        targetColor="#ef4444"
                      />
                      <SingleMetricChart
                        data={dashboardData.chartData.map(d => ({ date: d.date, value: d.protein }))}
                        target={dashboardData.targets.proteinTarget}
                        title={t("protein")}
                        unit="g"
                        color="#8884d8"
                        targetColor="#10b981"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}