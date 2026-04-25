"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCsrfToken } from "@/lib/useCsrfToken";

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

function formatISOToDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function isMealItemComplete(item: ParsedMealItem): boolean {
  if (!item.name.trim() || !item.unit.trim()) {
    return false;
  }
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }
  for (const key of ["calories", "protein", "carbs", "fat"] as const) {
    const n = Number(item[key]);
    if (!Number.isFinite(n) || n < 0) {
      return false;
    }
  }
  return true;
}

export default function MealsPage() {
  const t = useTranslations("Meals");
  const { locale } = useParams() as { locale?: string };
  const { csrfToken } = useCsrfToken();

  const mealTitleOptions = [
    { value: t.raw("mealTitleBreakfast"), label: t("mealTitleBreakfast") },
    { value: t.raw("mealTitleMidMorning"), label: t("mealTitleMidMorning") },
    { value: t.raw("mealTitleLunch"), label: t("mealTitleLunch") },
    { value: t.raw("mealTitleAfternoon"), label: t("mealTitleAfternoon") },
    { value: t.raw("mealTitleDinner"), label: t("mealTitleDinner") },
    { value: t.raw("mealTitleSnack"), label: t("mealTitleSnack") },
  ];
  const [title, setTitle] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [mealText, setMealText] = useState("");
  const [mealDate, setMealDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMealData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const mealDateInputRef = useRef<HTMLInputElement | null>(null);

  async function handleParseMeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setParseError(null);
    setSaveError(null);
    setSaveSuccess(null);
    setParsedMeal(null);

    try {
      if (!selectedTitle) {
        throw new Error(t("selectMealTitle"));
      }
      if (!csrfToken) {
        throw new Error("Security error: CSRF token not available");
      }
      const res = await fetch("/api/meals/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
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

  const allItemsComplete = useMemo(() => {
    if (!parsedMeal?.items.length) {
      return false;
    }
    return parsedMeal.items.every(isMealItemComplete);
  }, [parsedMeal]);

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
      if (!title.trim()) {
        throw new Error(t("selectMealTitle"));
      }
      if (!csrfToken) {
        throw new Error("Security error: CSRF token not available");
      }
      if (parsedMeal.items.length === 0) {
        throw new Error(t("noItems"));
      }

      if (!parsedMeal.items.every(isMealItemComplete)) {
        throw new Error(t("incompleteItemFields"));
      }

      const cleanedItems = parsedMeal.items.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim(),
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
      }));

      if (!/^\d{4}-\d{2}-\d{2}$/.test(mealDate)) {
        throw new Error(t("invalidDateFormat"));
      }

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({
          title,
          mealDate: new Date(`${mealDate}T12:00:00`).toISOString(),
          items: cleanedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save meal");
      setSaveSuccess(t("saveSuccess"));
      setParsedMeal(null);
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Unknown save error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-[1152px] rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-brand">{t("title")}</h1>
        <p className="mb-8 text-sm text-ink-muted md:text-base">{t("subtitle")}</p>

        <form onSubmit={handleParseMeal} className="space-y-4">
          <div>
            <label className="label-stitch">{t("mealTitle")}</label>
            <select
              className="input-stitch mb-2"
              value={selectedTitle}
              onChange={(e) => {
                setSelectedTitle(e.target.value);
                setTitle(e.target.value);
              }}
              required
            >
              <option value="" disabled>
                {t("selectMealTitle")}
              </option>
              {mealTitleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-stitch">{t("mealDate")}</label>
            <button
              type="button"
              onClick={() => {
                const input = mealDateInputRef.current;
                if (!input) return;
                const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
                if (typeof pickerInput.showPicker === "function") {
                  pickerInput.showPicker();
                } else {
                  input.focus();
                }
              }}
              className="relative block w-full text-left"
            >
              <div className="input-stitch pr-10">{formatISOToDisplayDate(mealDate)}</div>
              <input
                ref={mealDateInputRef}
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label={t("mealDate")}
              />
            </button>
          </div>

          <div>
            <label className="label-stitch">{t("mealDescription")}</label>
            <textarea
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              className="input-stitch min-h-[160px] resize-none font-normal leading-relaxed placeholder:text-ink-muted/60"
              placeholder={t("mealDescriptionPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-brand disabled:opacity-50"
            >
              {loading ? t("parsing") : t("parseMeal")}
            </button>
            <button
              type="button"
              onClick={addEmptyMealItem}
              className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm font-semibold text-brand transition hover:bg-surface-soft"
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
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-border bg-surface-soft p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display font-semibold text-brand">{t("parsedItems")}</p>
                <button
                  type="button"
                  onClick={addEmptyMealItem}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-surface-soft"
                >
                  {t("addItem")}
                </button>
              </div>

              <div className="space-y-4">
                {parsedMeal.items.map((item, index) => (
                  <div key={index} className="rounded-xl border border-border bg-surface p-4 ambient-shadow">
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
                          <label className="label-stitch">{t(field)}</label>
                          <input
                            type={field === "name" || field === "unit" ? "text" : "number"}
                            step="0.1"
                            value={item[field]}
                            onChange={(e) => updateMealItem(index, field, e.target.value)}
                            className="input-stitch"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 md:p-6 ambient-shadow">
              <p className="mb-3 font-display font-semibold text-brand">{t("computedTotals")}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(["calories", "protein", "carbs", "fat"] as const).map((macro) => (
                  <div key={macro} className="rounded-xl border border-border bg-surface-soft p-3">
                    <p className="text-sm text-ink-muted">{t(macro)}</p>
                    <p className="font-display text-lg font-semibold text-brand">
                      {computedTotals[macro]} {macro === "calories" ? "kcal" : "g"}
                    </p>
                  </div>
                ))}
              </div>

              {!allItemsComplete && (
                <p className="mt-3 text-sm text-amber-800">{t("incompleteItemFields")}</p>
              )}

              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={saving || !allItemsComplete}
                className="btn-brand-lg mt-4 w-full disabled:opacity-50"
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
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
            <p className="font-medium">✓</p>
            <p>{saveSuccess}</p>
            <p className="mt-3 text-sm leading-relaxed">
              {t.rich("saveSuccessHistoryHint", {
                link: (chunks) => (
                  <Link href="/history" className="link-accent">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}