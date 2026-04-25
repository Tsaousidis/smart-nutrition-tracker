"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type MacroData = {
  carbs: number;
  protein: number;
  fat: number;
};

type Props = {
  data: MacroData;
  title: string;
};

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b"];

export default function MacroDonutChart({ data, title }: Props) {
  const t = useTranslations("Dashboard");

  const chartData = [
    { name: t("carbs"), value: data.carbs },
    { name: t("protein"), value: data.protein },
    { name: t("fat"), value: data.fat },
  ];

  const total = data.carbs + data.protein + data.fat;

  return (
    <div className="h-full rounded-2xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 400, height: 256 }}
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {total > 0 && (
        <div className="mt-2 text-center text-sm text-slate-500">
          {t("last7Days")}
        </div>
      )}
    </div>
  );
}