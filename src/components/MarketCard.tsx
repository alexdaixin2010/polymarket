"use client";

import Link from "next/link";
import { GammaMarket, PriceAlert } from "@/lib/types";
import { formatVolume, formatDate, parseOutcomes } from "@/lib/utils";
import PriceAlertBadge from "./PriceAlertBadge";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];

interface MarketCardProps {
  market: GammaMarket;
  linkPrefix: "/hot" | "/my" | "/archived";
  priceAlert?: PriceAlert | null;
  eventTitle?: string;
  eventSlug?: string;
}

export default function MarketCard({
  market,
  linkPrefix,
  priceAlert,
  eventTitle,
  eventSlug,
}: MarketCardProps) {
  const outcomes = parseOutcomes(market);
  const volume = parseFloat(market.volume) || 0;
  const liquidity = parseFloat(market.liquidity) || 0;

  const isBinary =
    outcomes.length === 2 &&
    outcomes[0].name.toLowerCase() === "yes" &&
    outcomes[1].name.toLowerCase() === "no";

  const yesPrice = outcomes[0]?.price ?? 0;

  const linkHref =
    eventTitle && eventSlug
      ? `${linkPrefix}/${market.id}?eventTitle=${encodeURIComponent(eventTitle)}&eventSlug=${encodeURIComponent(eventSlug)}`
      : `${linkPrefix}/${market.id}`;

  return (
    <Link
      href={linkHref}
      className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Title row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
          {eventTitle ?? market.question}
        </h3>
        {priceAlert && (
          <PriceAlertBadge currentPrice={yesPrice} alert={priceAlert} />
        )}
      </div>

      {/* Outcomes */}
      {isBinary ? (
        <>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-blue-600">
              {Math.round(yesPrice * 100)}% Yes
            </span>
            <span className="text-gray-400">
              {Math.round((1 - yesPrice) * 100)}% No
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${yesPrice * 100}%` }}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {[...outcomes]
            .sort((a, b) => b.price - a.price)
            .map((o, i) => (
              <div key={o.name} className="flex items-center gap-2">
                <span className="w-28 truncate text-xs text-gray-700">{o.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(o.price * 100, 0.5)}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span
                  className="w-8 text-right text-xs font-semibold"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {Math.round(o.price * 100)}%
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>Vol: {formatVolume(volume)}</span>
        <span>Liq: {formatVolume(liquidity)}</span>
        {market.endDate && <span>Ends {formatDate(market.endDate)}</span>}
      </div>
    </Link>
  );
}
