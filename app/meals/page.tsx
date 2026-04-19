"use client";

import { useMemo, useState } from "react";

type ParsedMealItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ParsedMealData = {
  items: ParsedMealItem[];
  mealTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export default function MealsPage() {
  const [title, setTitle] = useState("Breakfast");
  const [mealText, setMealText] = useState("2 eggs and 2 slices of toast");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [parsedMeal, setParsedMeal] = useState<ParsedMealData | null>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  async function handleParseMeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setParseError(null);
    setSaveError(null);
    setSaveSuccess(null);
    setParsedMeal(null);

    try {
      const res = await fetch("/api/meals/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mealText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to parse meal");
      }

      setParsedMeal(data.data);
    } catch (err) {
      console.error(err);
      setParseError(err instanceof Error ? err.message : "Unknown parse error");
    } finally {
      setLoading(false);
    }
  }

  function updateMealItem(
    index: number,
    field: keyof ParsedMealItem,
    value: string
  ) {
    if (!parsedMeal) return;

    const numericFields: Array<keyof ParsedMealItem> = [
      "quantity",
      "calories",
      "protein",
      "carbs",
      "fat",
    ];

    const updatedItems = [...parsedMeal.items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numericFields.includes(field) ? Number(value) : value,
    } as ParsedMealItem;

    setParsedMeal({
      ...parsedMeal,
      items: updatedItems,
    });
  }

  function deleteMealItem(index: number) {
    if (!parsedMeal) return;

    const updatedItems = parsedMeal.items.filter((_, i) => i !== index);

    setParsedMeal({
      ...parsedMeal,
      items: updatedItems,
    });
  }

  function addEmptyMealItem() {
    if (!parsedMeal) {
      setParsedMeal({
        items: [
          {
            name: "",
            quantity: 1,
            unit: "serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
        ],
        mealTotal: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      });
      return;
    }

    setParsedMeal({
      ...parsedMeal,
      items: [
        ...parsedMeal.items,
        {
          name: "",
          quantity: 1,
          unit: "serving",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      ],
    });
  }

  const computedTotals = useMemo(() => {
    const items = parsedMeal?.items ?? [];

    const totals = items.reduce(
      (acc, item) => {
        acc.calories += Number(item.calories) || 0;
        acc.protein += Number(item.protein) || 0;
        acc.carbs += Number(item.carbs) || 0;
        acc.fat += Number(item.fat) || 0;
        return acc;
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    );

    return {
      calories: roundOne(totals.calories),
      protein: roundOne(totals.protein),
      carbs: roundOne(totals.carbs),
      fat: roundOne(totals.fat),
    };
  }, [parsedMeal]);

  async function handleSaveMeal() {
    if (!parsedMeal) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const cleanedItems = parsedMeal.items
        .filter((item) => item.name.trim() !== "")
        .map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          unit: item.unit.trim(),
          calories: Number(item.calories),
          protein: Number(item.protein),
          carbs: Number(item.carbs),
          fat: Number(item.fat),
        }));

      if (cleanedItems.length === 0) {
        throw new Error("You must have at least one meal item before saving.");
      }

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          mealDate: new Date().toISOString(),
          items: cleanedItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save meal");
      }

      setSaveSuccess("Meal saved successfully.");
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Unknown save error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Meal Parser</h1>
        <p className="mb-6 text-sm text-gray-600">
          Parse meal text with Gemini, review the extracted items, edit them if
          needed, and then save to PostgreSQL.
        </p>

        <form onSubmit={handleParseMeal} className="space-y-4">


          <div>
            <label className="mb-1 block text-sm font-medium">Meal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Example: Breakfast"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Meal Description
            </label>
            <textarea
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              className="min-h-[140px] w-full rounded-lg border px-3 py-2"
              placeholder="Example: 2 eggs, 1 chicken sandwich, and a banana"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Parsing..." : "Parse Meal"}
            </button>

            <button
              type="button"
              onClick={addEmptyMealItem}
              className="rounded-lg border px-4 py-2"
            >
              Review & Edit Items
            </button>
          </div>
        </form>

        {parseError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-medium">Parse Error</p>
            <p>{parseError}</p>
          </div>
        )}

        {parsedMeal && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium">Parsed / Editable Meal Items</p>
                <button
                  type="button"
                  onClick={addEmptyMealItem}
                  className="rounded-lg border bg-white px-3 py-2 text-sm"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {parsedMeal.items.map((item, index) => (
                  <div key={index} className="rounded-xl border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium">Item #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => deleteMealItem(index)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Name
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateMealItem(index, "name", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateMealItem(index, "quantity", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            updateMealItem(index, "unit", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Calories
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.calories}
                          onChange={(e) =>
                            updateMealItem(index, "calories", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Protein
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.protein}
                          onChange={(e) =>
                            updateMealItem(index, "protein", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Carbs
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.carbs}
                          onChange={(e) =>
                            updateMealItem(index, "carbs", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Fat
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.fat}
                          onChange={(e) =>
                            updateMealItem(index, "fat", e.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="mb-3 font-medium">Computed Meal Totals</p>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border p-3">
                  <p className="text-sm text-gray-500">Calories</p>
                  <p className="text-lg font-semibold">
                    {computedTotals.calories} kcal
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-sm text-gray-500">Protein</p>
                  <p className="text-lg font-semibold">
                    {computedTotals.protein} g
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-sm text-gray-500">Carbs</p>
                  <p className="text-lg font-semibold">
                    {computedTotals.carbs} g
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-sm text-gray-500">Fat</p>
                  <p className="text-lg font-semibold">
                    {computedTotals.fat} g
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveMeal}
                disabled={saving}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Meal"}
              </button>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-medium">Save Error</p>
            <p>{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
            <p className="font-medium">Success</p>
            <p>{saveSuccess}</p>
          </div>
        )}
      </div>
    </main>
  );
}