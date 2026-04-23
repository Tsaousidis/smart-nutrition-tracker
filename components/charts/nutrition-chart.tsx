"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  date: string;
  calories: number;
  protein: number;
};

type Props = {
  data: ChartData[];
};

export default function NutritionChart({ data }: Props) {
  const t = useTranslations("History");
  
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">{t("nutritionTrends")}</h2>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="calories"
              stroke="#000"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="protein"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}