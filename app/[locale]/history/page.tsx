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
  uniqueMealTypeCount: number;
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
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  function getIsoDate(offsetDays = 0): string {
    // Use user's local timezone for date (same logic as meals page)
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(now.getTime() - offset);
    localDate.setDate(localDate.getDate() + offsetDays);
    return localDate.toISOString().slice(0, 10);
  }

  const [selectedDate, setSelectedDate] = useState<string>(getIsoDate());

  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function loadHistory(date: string) {
    setLoading(true);
    setError(null);

    try {
      // Get user's timezone and send as header
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/history?date=${date}`, {
        headers: {
          "x-user-timezone": userTimezone,
        },
      });
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

          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-muted">{t("dateLabel")}</span>
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
                  className="group relative flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 transition hover:border-brand hover:shadow-sm"
                >
                  <svg className="h-4 w-4 text-ink-muted transition group-hover:text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-brand">{formatDateForDisplay(selectedDate)}</span>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate(-1))}
                  className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-brand"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t("yesterday")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getIsoDate())}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    selectedDate === getIsoDate()
                      ? "bg-brand text-white"
                      : "border border-border bg-surface text-ink-muted hover:border-brand hover:text-brand"
                  }`}
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={() => loadHistory(selectedDate)}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? t("loading") : t("refresh")}
                </button>
              </div>
            </div>
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
                    {selectedDay.uniqueMealTypeCount} {selectedDay.uniqueMealTypeCount === 1 ? t("meals") : t("mealsPlural")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="text-ink-muted">{t("calories")}:</span>
                  <span className="font-medium text-ink">{selectedDay.totals.calories}</span>
                  <span className="text-ink-muted">|</span>
                  <span className="text-ink-muted">{t("protein")}:</span>
                  <span className="font-medium text-ink">{selectedDay.totals.protein}g</span>
                  <span className="text-ink-muted">|</span>
                  <span className="text-ink-muted">{t("carbs")}:</span>
                  <span className="font-medium text-ink">{selectedDay.totals.carbs}g</span>
                  <span className="text-ink-muted">|</span>
                  <span className="text-ink-muted">{t("fat")}:</span>
                  <span className="font-medium text-ink">{selectedDay.totals.fat}g</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDay.meals.map((meal) => (
                  <div key={meal.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{meal.title || t("untitledMeal")}</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(meal.mealDate).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingMealId === meal.id}
                        className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingMealId === meal.id ? t("deleting") : t("deleteMeal")}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded bg-surface-soft px-2.5 py-1.5 text-sm"
                        >
                          <p className="text-ink">
                            {item.name} — {item.quantity} {item.unit}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {item.calories} kcal
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