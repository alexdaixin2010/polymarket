"use client";

import { HotListTopic } from "@/lib/types";

interface HotListTabsProps {
  active: HotListTopic;
  onChange: (topic: HotListTopic) => void;
}

const TOPICS: { key: HotListTopic; label: string }[] = [
  { key: "politics", label: "Politics" },
  { key: "tech", label: "Tech" },
  { key: "finance", label: "Finance" },
  { key: "breaking", label: "Breaking" },
  { key: "new", label: "New" },
  { key: "iran", label: "Iran" },
];

export default function HotListTabs({ active, onChange }: HotListTabsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {TOPICS.map((topic) => (
        <button
          key={topic.key}
          onClick={() => onChange(topic.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            active === topic.key
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {topic.label}
        </button>
      ))}
    </div>
  );
}
