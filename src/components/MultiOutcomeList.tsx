"use client";

import { useState } from "react";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];
const DEFAULT_SHOWN = 3;

interface OutcomeOption {
  id: string;
  label: string | null;
  probability: number | null;
  highlighted?: boolean; // e.g. the specific market the user added
}

interface MultiOutcomeListProps {
  options: OutcomeOption[];
}

export default function MultiOutcomeList({ options }: MultiOutcomeListProps) {
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? options : options.slice(0, DEFAULT_SHOWN);
  const hidden = options.length - DEFAULT_SHOWN;

  return (
    <div className="space-y-3">
      {shown.map(({ id, label, probability, highlighted }, i) => (
        <div
          key={id}
          className={`flex items-center gap-3 ${highlighted === false ? "opacity-60" : ""}`}
        >
          <span
            className="w-36 truncate text-sm font-medium"
            style={{ color: COLORS[i % COLORS.length] }}
            title={label ?? ""}
          >
            {label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((probability ?? 0) * 100, 0.5)}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <span
            className="w-10 text-right text-sm font-semibold"
            style={{ color: COLORS[i % COLORS.length] }}
          >
            {Math.round((probability ?? 0) * 100)}%
          </span>
        </div>
      ))}

      {hidden > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-500"
        >
          {expanded ? "Show less ▲" : `Show ${hidden} more ▼`}
        </button>
      )}
    </div>
  );
}
