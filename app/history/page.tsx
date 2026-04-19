"use client";

import { useEffect, useState } from "react";

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
    days: HistoryDay[];
  };
};

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function loadHistory() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/history");
      const data: HistoryResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to fetch history");
      }

      setHistoryDays(data.data?.days ?? []);
      setUserEmail(data.data?.user.email ?? null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown history error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border p-6 shadow-sm">
          <h1 className="text-3xl font-bold">7-Day History</h1>
          <p className="mt-2 text-sm text-gray-600">
            View meals and nutrition totals for the last 7 days.
          </p>

          {userEmail && (
            <p className="mt-2 text-sm text-gray-500">
              Logged in as: {userEmail}
            </p>
          )}

          <div className="mt-6">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh History"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {historyDays.length === 0 && !loading && !error && (
          <div className="rounded-2xl border p-6 text-sm text-gray-600 shadow-sm">
            No history found for the last 7 days.
          </div>
        )}

        <div className="space-y-6">
          {historyDays.map((day) => (
            <div key={day.date} className="rounded-2xl border p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{day.date}</h2>
                  <p className="text-sm text-gray-500">
                    {day.mealCount} meal{day.mealCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">Calories:</span>{" "}
                    {day.totals.calories}
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">Protein:</span>{" "}
                    {day.totals.protein}g
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">Carbs:</span> {day.totals.carbs}g
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium">Fat:</span> {day.totals.fat}g
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {day.meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl border p-4">
                    <div className="mb-3">
                      <p className="font-medium">{meal.title || "Untitled Meal"}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(meal.mealDate).toLocaleString()}
                      </p>
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
          ))}
        </div>
      </div>
    </main>
  );
}