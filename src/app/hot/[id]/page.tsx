"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { GammaMarket, GammaEvent, ArchivedItem } from "@/lib/types";
import { formatVolume, formatDate, parseOutcomes, getClobTokenIds } from "@/lib/utils";
import PriceChart from "@/components/PriceChart";
import MultiOutcomeList from "@/components/MultiOutcomeList";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];

export default function HotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const eventTitle = searchParams.get("eventTitle");
  const eventSlug = searchParams.get("eventSlug");

  const [market, setMarket] = useState<GammaMarket | null>(null);
  const [event, setEvent] = useState<GammaEvent | null>(null);
  const [archivedItem, setArchivedItem] = useState<ArchivedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  useEffect(() => {
    const fetchMarket = fetch(`/api/markets/${id}`)
      .then((res) => (res.ok ? res.json() : null));

    const fetchEvent = eventSlug
      ? fetch(`/api/events?slug=${eventSlug}`).then((res) =>
          res.ok ? res.json().then((d: GammaEvent[]) => d[0] ?? null) : null
        )
      : Promise.resolve(null);

    const fetchUserData = fetch("/api/user-data").then((res) => res.json());

    Promise.all([fetchMarket, fetchEvent, fetchUserData])
      .then(([m, e, userData]) => {
        setMarket(m);
        setEvent(e);
        const matches: ArchivedItem[] =
          userData.archived?.filter((i: ArchivedItem) => i.marketId === id) ?? [];
        setArchivedItem(matches[matches.length - 1] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, eventSlug]);

  async function handleAdd() {
    if (!market) return;
    setAdding(true);
    try {
      // If already archived, restore it (preserves notes, analyses, eventSlug)
      const action = archivedItem ? "restore" : "add";
      await fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, marketId: market.id, eventSlug: eventSlug ?? undefined }),
      });
      setAdded(true);
      setArchivedItem(null);
    } catch {
      alert("Failed to add to My List");
    }
    setAdding(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Market not found
      </div>
    );
  }

  const isMultiMarket = event && event.markets.length > 1;
  const tokenIds = getClobTokenIds(market);
  const volume = parseFloat(market.volume) || 0;
  const liquidity = parseFloat(market.liquidity) || 0;

  // For multi-market events: build options from all sub-markets
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

  // For single-market: outcomes within the market
  const marketOutcomes = !isMultiMarket ? parseOutcomes(market) : [];

  // Chart data
  const chartTokenIds = isMultiMarket && eventOptions
    ? eventOptions.slice(0, 6).map((o) => o.tokenId).filter(Boolean) as string[]
    : tokenIds;
  const chartOutcomeNames = isMultiMarket && eventOptions
    ? eventOptions.slice(0, 6).map((o) => o.label ?? "")
    : marketOutcomes.map((o) => o.name);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </button>
        {(eventSlug || market.slug) && (
          <a
            href={`https://polymarket.com/event/${eventSlug ?? market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View on Polymarket &rarr;
          </a>
        )}
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {eventTitle ?? market.question}
            </h1>
            {archivedItem && (
              <span className="shrink-0 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-600">
                Archived
              </span>
            )}
          </div>
          {isMultiMarket && market.groupItemTitle && (
            <p className="mt-1 text-sm text-gray-500">
              Viewing: <span className="font-medium text-gray-700">{market.groupItemTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || added}
          className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {added ? "Added!" : adding ? "Adding..." : "Add to My List"}
        </button>
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
          // Single market: binary or multi-outcome
          (() => {
            const isBinary =
              marketOutcomes.length === 2 &&
              marketOutcomes[0].name.toLowerCase() === "yes" &&
              marketOutcomes[1].name.toLowerCase() === "no";
            const yesPrice = marketOutcomes[0]?.price ?? 0;

            return isBinary ? (
              <>
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold text-blue-600">
                    {Math.round(yesPrice * 100)}% Yes
                  </span>
                  <span className="font-semibold text-gray-400">
                    {Math.round((1 - yesPrice) * 100)}% No
                  </span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${yesPrice * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {marketOutcomes.map((o, i) => (
                  <div key={o.name} className="flex items-center gap-3">
                    <span
                      className="w-36 truncate text-sm font-medium"
                      style={{ color: COLORS[i % COLORS.length] }}
                    >
                      {o.name}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(o.price * 100, 0.5)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span
                      className="w-10 text-right text-sm font-semibold"
                      style={{ color: COLORS[i % COLORS.length] }}
                    >
                      {Math.round(o.price * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* Price chart */}
      {chartTokenIds.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Price History
          </h2>
          <PriceChart
            tokenIds={chartTokenIds}
            outcomeNames={chartOutcomeNames}
          />
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Volume</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatVolume(volume)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Liquidity</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatVolume(liquidity)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">End Date</div>
          <div className="text-lg font-semibold text-gray-900">
            {market.endDate ? formatDate(market.endDate) : "N/A"}
          </div>
        </div>
      </div>

      {/* Description */}
      {market.description && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Resolution Criteria
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {market.description}
          </p>
        </div>
      )}

      {/* Archived: Notes (read-only) */}
      {archivedItem && (
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
      )}

      {/* Archived: Summary History */}
      {archivedItem && (() => {
        const summaryAnalyses = [...(archivedItem.analyses ?? [])]
          .filter((a) => a.summary)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
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
        );
      })()}
    </div>
  );
}
