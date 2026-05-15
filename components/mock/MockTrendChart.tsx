"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

interface Attempt {
  index: number;
  date: string; // pre-formatted for the X axis
  pct: number;
}

interface Props {
  attempts: Attempt[];
}

export function MockTrendChart({ attempts }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={attempts} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "Score"]}
          />
          <ReferenceLine
            y={61}
            stroke="#dc2626"
            strokeDasharray="4 2"
            label={{
              value: "Pass 61%",
              position: "right",
              fill: "#dc2626",
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
