"use client";

import { useId } from "react";

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

export function LineChart({ title, data }: LineChartProps) {
  const gradientId = useId();
  const glowId = useId();
  const tooltipStyle = {
    backgroundColor: "rgba(24, 24, 27, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    color: "#f4f4f5",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.02), 0 16px 42px rgba(0,0,0,0.22), 0 0 18px rgba(255,255,255,0.008)",
    backdropFilter: "blur(16px)",
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
          <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.35" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              dot={false}
              filter={`url(#${glowId})`}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#10b981" }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
