"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
    { name: t("carbs"), value: data.carbs, color: COLORS[0] },
    { name: t("protein"), value: data.protein, color: COLORS[1] },
    { name: t("fat"), value: data.fat, color: COLORS[2] },
  ];

  const total = data.carbs + data.protein + data.fat;

  const renderLabel = ({ name, value }: { name?: string; value?: number }) => {
    if (!name || !value || total === 0) return "";
    const percentage = ((value / total) * 100).toFixed(0);
    return `${percentage}%`;
  };

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
              label={renderLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {total > 0 && (
        <>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-ink-muted">{item.name}:</span>
                <span className="font-medium text-ink">{Math.round(item.value)}g</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-xs text-slate-400">
            {t("last7Days")}
          </div>
        </>
      )}
    </div>
  );
}