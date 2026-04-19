"use client";

import { useEffect, useState } from "react";
import MacroCard from "@/components/dashboard/macro-card";
import DailySummary from "@/components/dashboard/daily-summary";
import { signOut } from "next-auth/react";

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
  };
};

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Daily Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Today&apos;s nutrition totals, targets, remaining macros, and
                saved meals.
              </p>
              {dashboardData?.user?.email && (
                <p className="mt-2 text-sm text-gray-500">
                  Logged in as: {dashboardData.user.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Log Out
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MacroCard
                title="Calories"
                total={dashboardData.totals.calories}
                target={dashboardData.targets.dailyCalories}
                remaining={dashboardData.remaining.calories}
                unit="kcal"
              />
              <MacroCard
                title="Protein"
                total={dashboardData.totals.protein}
                target={dashboardData.targets.proteinTarget}
                remaining={dashboardData.remaining.protein}
                unit="g"
              />
              <MacroCard
                title="Carbs"
                total={dashboardData.totals.carbs}
                target={dashboardData.targets.carbsTarget}
                remaining={dashboardData.remaining.carbs}
                unit="g"
              />
              <MacroCard
                title="Fat"
                total={dashboardData.totals.fat}
                target={dashboardData.targets.fatTarget}
                remaining={dashboardData.remaining.fat}
                unit="g"
              />

            </div>

            <DailySummary meals={dashboardData.meals} />
          </div>
        )}
      </div>
    </main>
  );
}