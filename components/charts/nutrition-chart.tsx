"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

type ChartData = {
  date: string;
  calories: number;
  protein: number;
};

type Props = {
  data: ChartData[];
  targetCalories?: number;
  targetProtein?: number;
};

export default function NutritionChart({ data, targetCalories, targetProtein }: Props) {
  const t = useTranslations("History");
  
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">{t("nutritionTrends")}</h2>
        <div className="space-y-1 text-sm text-slate-600">
          {targetCalories !== undefined && (
            <p>{t("caloriesTargetLabel", { value: targetCalories.toFixed(0) })}</p>
          )}
          {targetProtein !== undefined && (
            <p>{t("proteinTargetLabel", { value: targetProtein.toFixed(0) })}</p>
          )}
        </div>
      </div>

      <div className="h-80 w-full min-w-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 400, height: 320 }}
        >
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#000" />
            <YAxis yAxisId="right" orientation="right" stroke="#8884d8" />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calories"
              name={t("calories")}
              stroke="#000"
              strokeWidth={2}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="protein"
              name={t("protein")}
              stroke="#8884d8"
              strokeWidth={2}
            />

            {typeof targetCalories === "number" && (
              <ReferenceLine
                yAxisId="left"
                y={targetCalories}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ position: "insideTopRight", value: t("caloriesTarget"), fill: "#ef4444", fontSize: 12 }}
              />
            )}

            {typeof targetProtein === "number" && (
              <ReferenceLine
                yAxisId="right"
                y={targetProtein}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ position: "insideTopRight", value: t("proteinTarget"), fill: "#10b981", fontSize: 12 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}