"use client";

import { useEffect, useState } from "react";
import Insights from "@/components/dashboard/insights";
import SingleMetricChart from "@/components/charts/single-metric-chart";
import MacroDonutChart from "@/components/charts/macro-donut-chart";
import WeeklySummary from "@/components/dashboard/weekly-summary";
import { generateInsights } from "@/lib/insights";
import { signOut } from "next-auth/react";
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
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="mt-2 text-sm text-gray-600">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {loading ? "..." : t("refresh")}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                {t("logout")}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {dashboardData && (
          <div className="space-y-8">
            <Insights insights={insights} />

            {dashboardData.chartData && dashboardData.chartData.length > 0 && (
              <div className="space-y-6">
                {/* Weekly Summary */}
                {dashboardData.weeklyAverages && (
                  <WeeklySummary 
                    averages={dashboardData.weeklyAverages}
                    targets={dashboardData.targets}
                  />
                )}

                {/* Macro Distribution + Charts side by side on large screens */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Macro Donut Chart */}
                  {dashboardData.weeklyMacroDistribution && (
                    <div className="lg:col-span-1">
                      <MacroDonutChart 
                        data={dashboardData.weeklyMacroDistribution}
                        title={t("macroDistribution")}
                      />
                    </div>
                  )}

                  {/* Line Charts */}
                  <div className={dashboardData.weeklyMacroDistribution ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="space-y-4">
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