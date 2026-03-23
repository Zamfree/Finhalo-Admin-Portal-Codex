"use client";

import { useId } from "react";

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

export function BarChart({ title, data }: BarChartProps) {
  const gradientId = useId();
  const tooltipStyle = {
    backgroundColor: "rgba(24, 24, 27, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    color: "#f4f4f5",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.02), 0 14px 34px rgba(0,0,0,0.22), 0 0 16px rgba(255,255,255,0.007)",
    backdropFilter: "blur(16px)",
    padding: "8px 12px",
    fontSize: "14px",
  } as const;

  return (
    <section className="admin-surface rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Last 7 days</p>
        </div>

        <div className="text-sm font-medium text-emerald-400">+12.4%</div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(96, 165, 250, 0.62)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.34)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={false}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Bar
              dataKey="value"
              fill={`url(#${gradientId})`}
              radius={[10, 10, 4, 4]}
              fillOpacity={0.92}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
