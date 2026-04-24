"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type HistoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type HistoryMeal = {
  id: string;
  title: string | null;
  mealDate: string;
  items: HistoryItem[];
};

type HistoryDay = {
  date: string;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealCount: number;
  meals: HistoryMeal[];
};

type HistoryResponse = {
  ok: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
    };
    range: {
      start: string;
      end: string;
    };
    selectedDay: HistoryDay | null;
    chartDays: HistoryDay[];
    goals?: {
      dailyCalories: number;
      proteinTarget: number;
      carbsTarget: number;
      fatTarget: number;
    };
  };
};

export default function HistoryPage() {
  const t = useTranslations("History");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);
  const [chartDays, setChartDays] = useState<HistoryDay[]>([]);
  const [goalTargets, setGoalTargets] = useState<{ dailyCalories: number; proteinTarget: number } | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  const params = useParams() as { locale?: string };
  const locale = params.locale ?? "en";

  function formatDateForChart(dateString: string): string {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatDateForDisplay(dateString: string): string {
    const [year, month, day] = dateString.split("-");
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getIsoDate(offsetDays = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  const [selectedDate, setSelectedDate] = useState<string>(getIsoDate());

  const chartData = chartDays.map((day) => ({
    date: formatDateForChart(day.date),
    calories: day.totals.calories,
    protein: day.totals.protein,
  }));

  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function loadHistory(date: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/history?date=${date}`);
      const data: HistoryResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to fetch history");
      }

      setSelectedDay(data.data?.selectedDay ?? null);
      setChartDays(data.data?.chartDays ?? []);
      setUserEmail(data.data?.user.email ?? null);
      setGoalTargets(
        data.data?.goals
          ? {
              dailyCalories: data.data.goals.dailyCalories,
              proteinTarget: data.data.goals.proteinTarget,
            }
          : null
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown history error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(selectedDate);
  }, [selectedDate]);

  async function handleDeleteMeal(mealId: string) {
    if (!confirm(t("confirmDeleteMeal"))) return;

    setDeletingMealId(mealId);
    try {
      const res = await fetch(`/api/meals?id=${mealId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to delete meal");
      }

      // Reload history to reflect the deletion
      loadHistory(selectedDate);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete meal");
    } finally {
      setDeletingMealId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border p-6 shadow-sm">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>

          {userEmail && (
            <p className="mt-2 text-sm text-gray-500">
              {t("loggedInAs")} {userEmail}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="history-date" className="text-sm font-medium">
                  {t("dateLabel")}
                </label>
                <input
                  id="history-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full max-w-[220px] rounded-lg border px-3 py-2"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate())}
                  className="rounded-lg border bg-white px-4 py-2 text-sm"
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate(-1))}
                  className="rounded-lg border bg-white px-4 py-2 text-sm"
                >
                  {t("yesterday")}
                </button>
                <button
                  type="button"
                  onClick={() => loadHistory(selectedDate)}
                  disabled={loading}
                  className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                  {loading ? t("loading") : t("refresh")}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">{t("historyForDate", { date: formatDateForDisplay(selectedDate) })}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {!selectedDay && !loading && !error && (
          <div className="rounded-2xl border p-6 text-sm text-gray-600 shadow-sm">
            {t("noMealsForDate")}
          </div>
        )}

        <div className="space-y-6">
          {selectedDay && (
            <div key={selectedDay.date} className="rounded-2xl border p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{formatDateForDisplay(selectedDay.date)}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedDay.mealCount} {selectedDay.mealCount === 1 ? t("meals") : t("mealsPlural")}
                  </p>
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">{t("calories")}:</span>{" "}
                    {selectedDay.totals.calories}
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">{t("protein")}:</span>{" "}
                    {selectedDay.totals.protein}g
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">{t("carbs")}:</span>{" "}
                    {selectedDay.totals.carbs}g
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">{t("fat")}:</span>{" "}
                    {selectedDay.totals.fat}g
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedDay.meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium">{meal.title || t("untitledMeal")}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(meal.mealDate).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingMealId === meal.id}
                        className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingMealId === meal.id ? t("deleting") : t("deleteMeal")}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
                        >
                          <p className="font-medium">
                            {item.name} — {item.quantity} {item.unit}
                          </p>
                          <p className="text-gray-600">
                            {item.calories} kcal | P: {item.protein}g | C:{" "}
                            {item.carbs}g | F: {item.fat}g
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}