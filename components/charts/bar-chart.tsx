"use client";

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
  return (
    <section className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#141414", borderColor: "#2a2a2a", borderRadius: "12px", color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
