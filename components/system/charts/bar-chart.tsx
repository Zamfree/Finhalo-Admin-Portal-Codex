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

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/20">
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
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(24, 24, 27, 0.96)", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "12px", color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[10, 10, 4, 4]} activeBar={{ fillOpacity: 0.8 }} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
