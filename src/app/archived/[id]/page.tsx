"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GammaMarket, GammaEvent, ArchivedItem } from "@/lib/types";
import {
  formatVolume,
  formatDate,
  parseOutcomes,
  getClobTokenIds,
} from "@/lib/utils";
import PriceChart from "@/components/PriceChart";
import OutcomesDisplay from "@/components/OutcomesDisplay";
import MultiOutcomeList from "@/components/MultiOutcomeList";

export default function ArchivedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [market, setMarket] = useState<GammaMarket | null>(null);
  const [event, setEvent] = useState<GammaEvent | null>(null);
  const [archivedItem, setArchivedItem] = useState<ArchivedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/markets/${id}`).then((res) => (res.ok ? res.json() : null)),
      fetch("/api/user-data").then((res) => res.json()),
    ])
      .then(([marketData, userData]) => {
        setMarket(marketData);

        // Use the last matching entry — handles duplicates, prefers the newest (with eventSlug)
        const matches: ArchivedItem[] =
          userData.archived?.filter((i: ArchivedItem) => i.marketId === id) ?? [];
        const item = matches[matches.length - 1] ?? null;
        setArchivedItem(item);

        // Fetch the full event: prefer stored eventSlug, fall back to market slug
        const slugToFetch = item?.eventSlug ?? marketData?.slug;
        if (slugToFetch) {
          return fetch(`/api/events?slug=${encodeURIComponent(slugToFetch)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((events: GammaEvent[] | null) => setEvent(events?.[0] ?? null))
            .catch(() => null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRestore() {
    setRestoring(true);
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", marketId: id }),
    });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!market || !archivedItem) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Archived market not found
      </div>
    );
  }

  const isMultiMarket = event && event.markets.length > 1;
  const marketOutcomes = parseOutcomes(market);

  const eventOptions = isMultiMarket
    ? event.markets
        .map((m) => {
          const outcomes = parseOutcomes(m);
          const tokenIdList = getClobTokenIds(m);
          return {
            id: m.id,
            label: m.groupItemTitle ?? m.question,
            probability: outcomes[0]?.price ?? null,
            tokenId: tokenIdList[0] ?? null,
          };
        })
        .filter((o) => o.probability !== null)
        .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
    : null;

  const chartTokenIds =
    isMultiMarket && eventOptions
      ? (eventOptions.slice(0, 6).map((o) => o.tokenId).filter(Boolean) as string[])
      : getClobTokenIds(market);
  const chartOutcomeNames =
    isMultiMarket && eventOptions
      ? eventOptions.slice(0, 6).map((o) => o.label ?? "")
      : marketOutcomes.map((o) => o.name);

  const eventSlug = archivedItem.eventSlug ?? market.slug;
  const volume = parseFloat(market.volume) || 0;
  const liquidity = parseFloat(market.liquidity) || 0;

  const summaryAnalyses = [...(archivedItem.analyses ?? [])]
    .filter((a) => a.summary)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      {/* Nav row */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </button>
        {eventSlug && (
          <a
            href={`https://polymarket.com/event/${eventSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View on Polymarket &rarr;
          </a>
        )}
      </div>

      {/* Title + Restore */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {event?.title ?? market.question}
          </h1>
          {isMultiMarket && market.groupItemTitle && (
            <p className="mt-1 text-sm text-gray-500">
              Added:{" "}
              <span className="font-medium text-gray-700">{market.groupItemTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleRestore}
          disabled={restoring}
          className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Restore to My List"}
        </button>
      </div>

      {/* Archived dates */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        Archived on {formatDate(archivedItem.archivedAt)} &middot; Added on{" "}
        {formatDate(archivedItem.addedAt)}
      </div>

      {/* Outcomes */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        {isMultiMarket && eventOptions ? (
          <MultiOutcomeList
            options={eventOptions.map(({ id: mid, label, probability }) => ({
              id: mid,
              label,
              probability,
              highlighted: mid === market.id,
            }))}
          />
        ) : (
          <OutcomesDisplay outcomes={marketOutcomes} />
        )}
      </div>

      {/* Price chart */}
      {chartTokenIds.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Price History</h2>
          <PriceChart tokenIds={chartTokenIds} outcomeNames={chartOutcomeNames} />
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Volume</div>
          <div className="text-lg font-semibold text-gray-900">{formatVolume(volume)}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Liquidity</div>
          <div className="text-lg font-semibold text-gray-900">{formatVolume(liquidity)}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">End Date</div>
          <div className="text-lg font-semibold text-gray-900">
            {market.endDate ? formatDate(market.endDate) : "N/A"}
          </div>
        </div>
      </div>

      {/* Resolution Criteria */}
      {market.description && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Resolution Criteria</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{market.description}</p>
        </div>
      )}

      {/* Notes (always shown, read-only) */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Notes</h3>
        <textarea
          value={archivedItem.notes ?? ""}
          readOnly
          rows={4}
          placeholder="No notes were added."
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
      </div>

      {/* Summary History */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Summary History</h3>
        {summaryAnalyses.length === 0 ? (
          <p className="text-sm text-gray-400">No analysis history yet.</p>
        ) : (
          <div className="space-y-2">
            {summaryAnalyses.map((a, i) => {
              const isExpanded = expandedAnalysis === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-gray-50 transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedAnalysis(isExpanded ? null : i)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <div className="w-24 shrink-0 pt-0.5 text-xs text-gray-400">{a.date}</div>
                    {a.price != null && (
                      <div className="w-12 shrink-0 pt-0.5 text-xs font-semibold text-blue-600">
                        {Math.round(a.price * 100)}%
                      </div>
                    )}
                    <div className="flex-1 text-sm text-gray-700">{a.summary}</div>
                    <div className="ml-2 shrink-0 pt-0.5 text-gray-400">
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{a.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
