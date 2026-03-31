"use client";

import { useId, useMemo } from "react";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BarChartPoint = {
  date: string;
  value: number;
};

type BarChartProps = {
  title: string;
  data: BarChartPoint[];
};

function formatTrend(data: BarChartPoint[]) {
  if (data.length < 2) return "—";

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const percent = ((last - first) / Math.max(first, 1)) * 100;

  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function BarChart({ title, data }: BarChartProps) {
  const gradientId = useId();
  const tooltipStyle = useMemo(
    () =>
      ({
        backgroundColor: "var(--admin-surface-bg)",
        borderColor: "var(--admin-border-strong)",
        borderRadius: "16px",
        color: "var(--admin-text)",
        boxShadow: "0 6px 16px rgba(2, 6, 23, 0.14)",
        padding: "8px 12px",
        fontSize: "14px",
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
          <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(96, 165, 250, 0.78)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.38)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={false} contentStyle={tooltipStyle} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[10, 10, 4, 4]} fillOpacity={0.92} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
