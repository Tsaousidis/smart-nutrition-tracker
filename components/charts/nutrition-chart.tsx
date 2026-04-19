"use client";

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
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Nutrition Trends (7 days)</h2>

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