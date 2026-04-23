"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

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

function parseDMYDate(dateString: string): string | null {
  const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function formatDateForInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function MealsPage() {
  const t = useTranslations("Meals");
  const { locale } = useParams() as { locale?: string };

  const [title, setTitle] = useState(t("mealTitleDefault"));
  const [mealText, setMealText] = useState(t("mealDescriptionDefault"));
  const [mealDate, setMealDate] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealText,
          locale: locale === "el" ? "el" : "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to parse meal");
      setParsedMeal(data.data);
    } catch (err) {
      console.error(err);
      setParseError(err instanceof Error ? err.message : "Unknown parse error");
    } finally {
      setLoading(false);
    }
  }

  function updateMealItem(index: number, field: keyof ParsedMealItem, value: string) {
    if (!parsedMeal) return;
    const numericFields: Array<keyof ParsedMealItem> = ["quantity", "calories", "protein", "carbs", "fat"];
    const updatedItems = [...parsedMeal.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numericFields.includes(field) ? Number(value) : value,
    } as ParsedMealItem;
    setParsedMeal({ ...parsedMeal, items: updatedItems });
  }

  function deleteMealItem(index: number) {
    if (!parsedMeal) return;
    setParsedMeal({ ...parsedMeal, items: parsedMeal.items.filter((_, i) => i !== index) });
  }

  function addEmptyMealItem() {
    const emptyItem = { name: "", quantity: 1, unit: "serving", calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!parsedMeal) {
      setParsedMeal({ items: [emptyItem], mealTotal: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
      return;
    }
    setParsedMeal({ ...parsedMeal, items: [...parsedMeal.items, emptyItem] });
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
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      calories: roundOne(totals.calories),
      protein: roundOne(totals.protein),
      carbs: roundOne(totals.carbs),
      fat: roundOne(totals.fat),
    };
  }, [parsedMeal]);

  async function handleSaveMeal() {
    if (!parsedMeal) return;
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

      if (cleanedItems.length === 0) throw new Error(t("noItems"));

      const isoDate = parseDMYDate(mealDate);
      if (!isoDate) {
        throw new Error(t("invalidDateFormat"));
      }

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mealDate: new Date(`${isoDate}T12:00:00`).toISOString(),
          items: cleanedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save meal");
      setSaveSuccess(t("saveSuccess"));
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
        <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
        <p className="mb-6 text-sm text-gray-600">{t("subtitle")}</p>

        <form onSubmit={handleParseMeal} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("mealTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder={t("mealTitlePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("mealDate")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                onBlur={(e) => {
                  const parsed = parseDMYDate(e.target.value);
                  if (parsed) {
                    setMealDate(formatDateForInput(new Date(parsed)));
                  } else {
                    setMealDate(formatDateForInput(new Date()));
                  }
                }}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="DD/MM/YYYY"
              />
              <input
                type="date"
                value={(function () {
                  const parsed = parseDMYDate(mealDate);
                  return parsed ? parsed.slice(0, 10) : "";
                })()}
                onChange={(e) => {
                  if (e.target.value) {
                    setMealDate(formatDateForInput(new Date(e.target.value)));
                  }
                }}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("mealDescription")}</label>
            <textarea
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              className="min-h-[140px] w-full rounded-lg border px-3 py-2"
              placeholder={t("mealDescriptionPlaceholder")}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? t("parsing") : t("parseMeal")}
            </button>
            <button
              type="button"
              onClick={addEmptyMealItem}
              className="rounded-lg border px-4 py-2"
            >
              {t("reviewEdit")}
            </button>
          </div>
        </form>

        {parseError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-medium">{t("parseError")}</p>
            <p>{parseError}</p>
          </div>
        )}

        {parsedMeal && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium">{t("parsedItems")}</p>
                <button
                  type="button"
                  onClick={addEmptyMealItem}
                  className="rounded-lg border bg-white px-3 py-2 text-sm"
                >
                  {t("addItem")}
                </button>
              </div>

              <div className="space-y-4">
                {parsedMeal.items.map((item, index) => (
                  <div key={index} className="rounded-xl border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium">{t("item")} #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => deleteMealItem(index)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700"
                      >
                        {t("delete")}
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {(["name", "quantity", "unit", "calories", "protein", "carbs", "fat"] as Array<keyof ParsedMealItem>).map((field) => (
                        <div key={field}>
                          <label className="mb-1 block text-sm font-medium">{t(field)}</label>
                          <input
                            type={field === "name" || field === "unit" ? "text" : "number"}
                            step="0.1"
                            value={item[field]}
                            onChange={(e) => updateMealItem(index, field, e.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="mb-3 font-medium">{t("computedTotals")}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(["calories", "protein", "carbs", "fat"] as const).map((macro) => (
                  <div key={macro} className="rounded-xl border p-3">
                    <p className="text-sm text-gray-500">{t(macro)}</p>
                    <p className="text-lg font-semibold">
                      {computedTotals[macro]} {macro === "calories" ? "kcal" : "g"}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveMeal}
                disabled={saving}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? t("saving") : t("saveMeal")}
              </button>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-medium">{t("saveError")}</p>
            <p>{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
            <p className="font-medium">✓</p>
            <p>{saveSuccess}</p>
          </div>
        )}
      </div>
    </main>
  );
}