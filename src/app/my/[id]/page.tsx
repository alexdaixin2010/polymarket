"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GammaMarket, GammaEvent, MyListItem, PriceAlert } from "@/lib/types";
import {
  formatVolume,
  formatDate,
  parseOutcomes,
  getClobTokenIds,
} from "@/lib/utils";
import PriceChart from "@/components/PriceChart";
import OutcomesDisplay from "@/components/OutcomesDisplay";
import MultiOutcomeList from "@/components/MultiOutcomeList";
import AnalysisTimeline from "@/components/AnalysisTimeline";
import NotesEditor from "@/components/NotesEditor";

export default function MyListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [market, setMarket] = useState<GammaMarket | null>(null);
  const [event, setEvent] = useState<GammaEvent | null>(null);
  const [myItem, setMyItem] = useState<MyListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  // Alert form state
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");

  useEffect(() => {
    Promise.all([
      fetch(`/api/markets/${id}`).then((res) => (res.ok ? res.json() : null)),
      fetch("/api/user-data").then((res) => res.json()),
    ])
      .then(([marketData, userData]) => {
        setMarket(marketData);
        const item = userData.myList?.find((i: MyListItem) => i.marketId === id);
        setMyItem(item || null);
        if (item?.priceAlert) {
          setAlertTarget(String(Math.round(item.priceAlert.target * 100)));
          setAlertDirection(item.priceAlert.direction);
        }
        // Fetch event if eventSlug is stored
        if (item?.eventSlug) {
          return fetch(`/api/events?slug=${encodeURIComponent(item.eventSlug)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((events: GammaEvent[] | null) => setEvent(events?.[0] ?? null))
            .catch(() => null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerateAnalysis() {
    if (!market || !myItem) return;
    setGenerating(true);
    try {
      const outcomes = parseOutcomes(market);
      const yesPrice = outcomes[0]?.price ?? 0;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          marketTitle: event?.title ?? market.question,
          marketDescription: market.description,
          currentPrice: yesPrice,
          userPrompt: analysisPrompt.trim() || undefined,
          userNotes: myItem.notes || undefined,
        }),
      });
      const analysis = await res.json();
      if (analysis.content) {
        setMyItem((prev) =>
          prev
            ? {
                ...prev,
                analyses: [
                  ...prev.analyses,
                  {
                    date: analysis.date,
                    content: analysis.content,
                    summary: analysis.summary ?? "",
                    price: analysis.price ?? null,
                  },
                ],
              }
            : null
        );
        setAnalysisPrompt("");
      } else if (analysis.error) {
        alert(analysis.error);
      }
    } catch {
      alert("Failed to generate analysis");
    }
    setGenerating(false);
  }

  async function handleSaveNotes(notes: string) {
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", marketId: id, updates: { notes } }),
    });
    setMyItem((prev) => (prev ? { ...prev, notes } : null));
  }

  async function handleSaveAlert() {
    const target = parseInt(alertTarget) / 100;
    if (isNaN(target) || target < 0 || target > 1) return;

    const priceAlert: PriceAlert = { target, direction: alertDirection };
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", marketId: id, updates: { priceAlert } }),
    });
    setMyItem((prev) => (prev ? { ...prev, priceAlert } : null));
  }

  async function handleArchive() {
    setArchiving(true);
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", marketId: id }),
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

  if (!market || !myItem) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Market not found in your list
      </div>
    );
  }

  const isMultiMarket = event && event.markets.length > 1;
  const marketOutcomes = parseOutcomes(market);

  // For multi-market: build all sub-market options sorted by probability
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

  // Chart token IDs
  const chartTokenIds = isMultiMarket && eventOptions
    ? (eventOptions.slice(0, 6).map((o) => o.tokenId).filter(Boolean) as string[])
    : getClobTokenIds(market);
  const chartOutcomeNames = isMultiMarket && eventOptions
    ? eventOptions.slice(0, 6).map((o) => o.label ?? "")
    : marketOutcomes.map((o) => o.name);

  const eventSlug = myItem.eventSlug ?? market.slug;
  const volume = parseFloat(market.volume) || 0;
  const liquidity = parseFloat(market.liquidity) || 0;

  return (
    <div>
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
          onClick={handleArchive}
          disabled={archiving}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {archiving ? "Archiving..." : "Archive"}
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

      {/* Description */}
      {market.description && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Resolution Criteria</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{market.description}</p>
        </div>
      )}

      {/* Price Alert */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Price Alert</h3>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Target (%)</label>
            <input
              type="number"
              value={alertTarget}
              onChange={(e) => setAlertTarget(e.target.value)}
              placeholder="e.g. 75"
              min="1"
              max="99"
              className="w-24 rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Direction</label>
            <select
              value={alertDirection}
              onChange={(e) => setAlertDirection(e.target.value as "above" | "below")}
              className="rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <button
            onClick={handleSaveAlert}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Set Alert
          </button>
        </div>
        {myItem.priceAlert && (
          <p className="mt-2 text-xs text-gray-500">
            Alert set: {myItem.priceAlert.direction}{" "}
            {Math.round(myItem.priceAlert.target * 100)}%
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <NotesEditor initialNotes={myItem.notes} onSave={handleSaveNotes} />
      </div>

      {/* AI Analysis */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">AI Analysis</h3>
        <div className="mb-4">
          <textarea
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            placeholder="Ask anything about this market… (leave blank for a standard daily analysis)"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
          />
          <button
            onClick={handleGenerateAnalysis}
            disabled={generating}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {generating ? "Analyzing…" : "Generate Analysis"}
          </button>
        </div>
        <AnalysisTimeline analyses={myItem.analyses} readOnly />
      </div>

      {/* Summary History */}
      {myItem.analyses.some((a) => a.summary) && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Summary History</h3>
          <div className="space-y-2">
            {[...myItem.analyses]
              .filter((a) => a.summary)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((a, i) => {
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
        </div>
      )}
    </div>
  );
}
