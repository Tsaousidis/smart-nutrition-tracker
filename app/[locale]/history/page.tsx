"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCsrfToken } from "@/lib/useCsrfToken";

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
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const { csrfToken } = useCsrfToken();
  const historyDateInputRef = useRef<HTMLInputElement | null>(null);

  const params = useParams() as { locale?: string };
  const locale = params.locale ?? "en";

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
      setUserEmail(data.data?.user.email ?? null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown history error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory(selectedDate);
  }, [selectedDate]);

  async function handleDeleteMeal(mealId: string) {
    if (!confirm(t("confirmDeleteMeal"))) return;

    setDeletingMealId(mealId);
    try {
      if (!csrfToken) {
        throw new Error("Security error: CSRF token not available");
      }
      const res = await fetch(`/api/meals?id=${mealId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
        credentials: "include",
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
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-[1152px]">
        <div className="mb-8 rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
          <h1 className="font-display text-3xl font-semibold text-brand">{t("title")}</h1>
          <p className="mt-2 text-sm text-ink-muted md:text-base">{t("subtitle")}</p>

          {userEmail ? (
            <p className="mt-2 text-sm text-ink-muted">
              {t("loggedInAs")} {userEmail}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="history-date" className="label-stitch mb-0 sm:mb-0">
                  {t("dateLabel")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const input = historyDateInputRef.current;
                    if (!input) return;
                    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
                    if (typeof pickerInput.showPicker === "function") {
                      pickerInput.showPicker();
                    } else {
                      input.focus();
                    }
                  }}
                  className="relative block max-w-[240px] text-left"
                >
                  <div className="input-stitch pr-10">{formatDateForDisplay(selectedDate)}</div>
                  <input
                    ref={historyDateInputRef}
                    id="history-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={t("dateLabel")}
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate())}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-surface-soft"
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate(-1))}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-surface-soft"
                >
                  {t("yesterday")}
                </button>
                <button
                  type="button"
                  onClick={() => loadHistory(selectedDate)}
                  disabled={loading}
                  className="btn-brand text-sm disabled:opacity-50"
                >
                  {loading ? t("loading") : t("refresh")}
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-muted">{t("historyForDate", { date: formatDateForDisplay(selectedDate) })}</p>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">{t("errorLabel")}</p>
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        {!selectedDay && !loading && !error && (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center text-sm text-ink-muted ambient-shadow">
            {t("noMealsForDate")}
          </div>
        )}

        <div className="space-y-6">
          {selectedDay && (
            <div key={selectedDay.date} className="rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-brand">{formatDateForDisplay(selectedDay.date)}</h2>
                  <p className="text-sm text-ink-muted">
                    {selectedDay.mealCount} {selectedDay.mealCount === 1 ? t("meals") : t("mealsPlural")}
                  </p>
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-lg border border-border bg-surface-soft px-3 py-2">
                    <span className="font-semibold text-brand">{t("calories")}:</span>{" "}
                    {selectedDay.totals.calories}
                  </div>
                  <div className="rounded-lg border border-border bg-surface-soft px-3 py-2">
                    <span className="font-semibold text-brand">{t("protein")}:</span>{" "}
                    {selectedDay.totals.protein}g
                  </div>
                  <div className="rounded-lg border border-border bg-surface-soft px-3 py-2">
                    <span className="font-semibold text-brand">{t("carbs")}:</span>{" "}
                    {selectedDay.totals.carbs}g
                  </div>
                  <div className="rounded-lg border border-border bg-surface-soft px-3 py-2">
                    <span className="font-semibold text-brand">{t("fat")}:</span>{" "}
                    {selectedDay.totals.fat}g
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedDay.meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl border border-border bg-surface-soft/80 p-4 transition hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand">{meal.title || t("untitledMeal")}</p>
                        <p className="text-sm text-ink-muted">
                          {new Date(meal.mealDate).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingMealId === meal.id}
                        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingMealId === meal.id ? t("deleting") : t("deleteMeal")}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-ink">
                            {item.name} — {item.quantity} {item.unit}
                          </p>
                          <p className="text-ink-muted">
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