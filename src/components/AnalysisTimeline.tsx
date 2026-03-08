"use client";

import { AnalysisEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AnalysisTimelineProps {
  analyses: AnalysisEntry[];
  onGenerate?: () => void;
  generating?: boolean;
  readOnly?: boolean;
}

export default function AnalysisTimeline({
  analyses,
  onGenerate,
  generating = false,
  readOnly = false,
}: AnalysisTimelineProps) {
  const sorted = [...analyses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
        {!readOnly && onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {generating ? "Analyzing..." : "Generate Today's Analysis"}
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">
          No analyses yet. Click the button above to generate the first one.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((entry) => (
            <div
              key={entry.date}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-2 text-xs font-medium text-gray-500">
                {formatDate(entry.date)}
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {entry.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
