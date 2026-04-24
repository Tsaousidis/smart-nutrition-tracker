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
  value: number;
};

type Props = {
  data: ChartData[];
  target?: number;
  title: string;
  unit: string;
  color: string;
  targetColor: string;
};

export default function SingleMetricChart({ data, target, title, unit, color, targetColor }: Props) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {target !== undefined && (
          <span className="text-sm text-slate-600">
            Target: {target.toFixed(0)} {unit}
          </span>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend verticalAlign="top" height={28} />

            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke={color}
              strokeWidth={2}
            />

            {typeof target === "number" && (
              <ReferenceLine
                y={target}
                stroke={targetColor}
                strokeDasharray="3 3"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}