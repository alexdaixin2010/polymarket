"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PriceHistoryPoint } from "@/lib/types";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];

interface PriceChartProps {
  tokenIds: string[];
  outcomeNames?: string[];
  interval?: "1h" | "6h" | "1d" | "1w" | "1m" | "max";
}

export default function PriceChart({
  tokenIds,
  outcomeNames,
  interval = "1m",
}: PriceChartProps) {
  const [data, setData] = useState<Record<string, string | number>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState(interval);

  const names = tokenIds.map((_, i) => outcomeNames?.[i] ?? `Outcome ${i + 1}`);
  const isBinary = tokenIds.length <= 2;

  useEffect(() => {
    if (tokenIds.length === 0) return;

    async function load() {
      setLoading(true);
      try {
        const histories = await Promise.all(
          tokenIds.map((id) =>
            fetch(
              `/api/prices-history?market=${id}&interval=${selectedInterval}&fidelity=60`
            )
              .then((res) => (res.ok ? res.json() : { history: [] }))
              .then((json: { history: PriceHistoryPoint[] }) => json.history ?? [])
              .catch(() => [] as PriceHistoryPoint[])
          )
        );

        // Use the longest history as the base for timestamps
        const base = histories.reduce(
          (a, b) => (a.length >= b.length ? a : b),
          []
        );

        const merged = base.map((point) => {
          const row: Record<string, string | number> = {
            date: new Date(point.t * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
          histories.forEach((hist, i) => {
            const key = names[i];
            if (hist.length === 0) {
              row[key] = 0;
              return;
            }
            const match = hist.reduce((prev, curr) =>
              Math.abs(curr.t - point.t) < Math.abs(prev.t - point.t)
                ? curr
                : prev
            );
            row[key] = Math.round(match.p * 100);
          });
          return row;
        });

        setData(merged);
      } catch {
        setData([]);
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIds.join(","), selectedInterval]);

  const intervals = ["1h", "6h", "1d", "1w", "1m", "max"] as const;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {intervals.map((iv) => (
          <button
            key={iv}
            onClick={() => setSelectedInterval(iv)}
            className={`rounded px-3 py-1 text-xs font-medium transition ${
              selectedInterval === iv
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {iv.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          Loading chart...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          No price data available
        </div>
      ) : isBinary ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, names[0]]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Area
              type="monotone"
              dataKey={names[0]}
              stroke={COLORS[0]}
              fill="#dbeafe"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
