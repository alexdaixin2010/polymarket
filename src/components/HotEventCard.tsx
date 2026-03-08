"use client";

import Link from "next/link";
import { GammaEvent, GammaMarket, PriceAlert } from "@/lib/types";
import { parseOutcomes, formatVolume, formatDate } from "@/lib/utils";
import PriceAlertBadge from "./PriceAlertBadge";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];
const MAX_SHOWN = 5;

interface HotEventCardProps {
  event: GammaEvent;
  customHref?: string; // if set, whole card links here instead of /hot/[id]
  priceAlert?: PriceAlert | null;
  isArchived?: boolean;
}

function marketLink(event: GammaEvent, market: GammaMarket) {
  return `/hot/${market.id}?eventTitle=${encodeURIComponent(event.title)}&eventSlug=${encodeURIComponent(event.slug)}`;
}

function StatsRow({ event }: { event: GammaEvent }) {
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
      <span>Vol: {formatVolume(event.volume)}</span>
      <span>Liq: {formatVolume(event.liquidity)}</span>
      {event.endDate && <span>Ends {formatDate(event.endDate)}</span>}
    </div>
  );
}

export default function HotEventCard({ event, customHref, priceAlert, isArchived }: HotEventCardProps) {
  const isMulti = event.markets.length > 1;

  if (!isMulti) {
    // Single market — binary or multi-outcome within one market
    const market = event.markets[0];
    const outcomes = parseOutcomes(market);
    const isBinary =
      outcomes.length === 2 &&
      outcomes[0].name.toLowerCase() === "yes" &&
      outcomes[1].name.toLowerCase() === "no";
    const yesPrice = outcomes[0]?.price ?? 0;
    const href = customHref ?? marketLink(event, market);

    return (
      <Link
        href={href}
        className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
            {event.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isArchived && (
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
                Archived
              </span>
            )}
            {priceAlert && (
              <PriceAlertBadge currentPrice={yesPrice} alert={priceAlert} />
            )}
          </div>
        </div>
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
            {outcomes.map((o, i) => (
              <div key={o.name} className="flex items-center gap-2">
                <span className="w-28 truncate text-xs text-gray-700">
                  {o.name}
                </span>
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
        <StatsRow event={event} />
      </Link>
    );
  }

  // Multi-market event — each sub-market is one outcome (Yes price = probability)
  const options = event.markets
    .map((m) => {
      const outcomes = parseOutcomes(m);
      const yesPrice = outcomes[0]?.price ?? null;
      return { market: m, label: m.groupItemTitle ?? m.question, probability: yesPrice };
    })
    .filter((o) => o.probability !== null)
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0));

  const shown = options.slice(0, MAX_SHOWN);
  const remaining = options.length - shown.length;

  // If customHref: whole card is a single link (no per-row links)
  if (customHref) {
    return (
      <Link
        href={customHref}
        className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
            {event.title}
          </h3>
          {isArchived && (
            <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
              Archived
            </span>
          )}
        </div>
        <div className="space-y-2">
          {shown.map(({ market, label, probability }, i) => (
            <div key={market.id} className="flex items-center gap-2">
              <span className="w-28 truncate text-xs text-gray-700" title={label ?? ""}>
                {label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((probability ?? 0) * 100, 0.5)}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span
                className="w-8 text-right text-xs font-semibold"
                style={{ color: COLORS[i % COLORS.length] }}
              >
                {Math.round((probability ?? 0) * 100)}%
              </span>
            </div>
          ))}
        </div>
        {remaining > 0 && (
          <p className="mt-2 text-xs text-gray-400">+{remaining} more options</p>
        )}
        <StatsRow event={event} />
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
          {event.title}
        </h3>
        {isArchived && (
          <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
            Archived
          </span>
        )}
      </div>
      <div className="space-y-2">
        {shown.map(({ market, label, probability }, i) => (
          <Link
            key={market.id}
            href={marketLink(event, market)}
            className="flex items-center gap-2 rounded transition hover:opacity-75"
          >
            <span className="w-28 truncate text-xs text-gray-700" title={label ?? ""}>
              {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((probability ?? 0) * 100, 0.5)}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span
              className="w-8 text-right text-xs font-semibold"
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {Math.round((probability ?? 0) * 100)}%
            </span>
          </Link>
        ))}
      </div>
      {remaining > 0 && (
        <p className="mt-2 text-xs text-gray-400">+{remaining} more options</p>
      )}
      <StatsRow event={event} />
    </div>
  );
}
