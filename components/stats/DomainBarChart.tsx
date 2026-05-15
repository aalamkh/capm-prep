"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from "recharts";
import type { DomainAccuracy } from "@/lib/stats";
import { PASS_THRESHOLD } from "@/lib/stats";

interface Props {
  data: DomainAccuracy[];
}

export function DomainBarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.label,
    pct: Math.round(d.pct * 100),
    total: d.total,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v, _name, item) => {
              const total =
                (item as { payload?: { total?: number } } | undefined)
                  ?.payload?.total ?? 0;
              return [`${v}% (${total} answered)`, "Accuracy"];
            }}
          />
          <ReferenceLine
            y={PASS_THRESHOLD * 100}
            stroke="#dc2626"
            strokeDasharray="4 2"
            label={{
              value: `Pass ${Math.round(PASS_THRESHOLD * 100)}%`,
              position: "right",
              fill: "#dc2626",
              fontSize: 11,
            }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={d.pct >= PASS_THRESHOLD * 100 ? "#16a34a" : "#f97316"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
