"use client";

import { useId, useMemo } from "react";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LineChartPoint = {
  date: string;
  value: number;
};

type LineChartProps = {
  title: string;
  data: LineChartPoint[];
};

function formatTrend(data: LineChartPoint[]) {
  if (data.length < 2) return "—";

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const percent = ((last - first) / Math.max(first, 1)) * 100;

  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function LineChart({ title, data }: LineChartProps) {
  const gradientId = useId();
  const tooltipStyle = useMemo(
    () =>
      ({
        backgroundColor: "var(--admin-surface-bg)",
        borderColor: "var(--admin-border-strong)",
        borderRadius: "16px",
        color: "var(--admin-text)",
        boxShadow: "0 10px 24px rgba(2, 6, 23, 0.16)",
        backdropFilter: "blur(16px)",
      }) as const,
    []
  );
  const trend = useMemo(() => formatTrend(data), [data]);

  return (
    <section className="admin-surface h-full rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-400">Last 7 days</p>
        </div>

        <div className="text-sm font-medium text-emerald-400">{trend}</div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a1a1aa" }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#10b981" }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
