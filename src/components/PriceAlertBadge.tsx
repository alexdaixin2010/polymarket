"use client";

import { PriceAlert } from "@/lib/types";

interface PriceAlertBadgeProps {
  currentPrice: number;
  alert: PriceAlert;
}

export default function PriceAlertBadge({
  currentPrice,
  alert,
}: PriceAlertBadgeProps) {
  const triggered =
    alert.direction === "above"
      ? currentPrice >= alert.target
      : currentPrice <= alert.target;

  if (!triggered) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Alert
    </span>
  );
}
