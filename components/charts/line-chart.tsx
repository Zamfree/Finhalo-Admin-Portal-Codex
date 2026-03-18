"use client";

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
  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
