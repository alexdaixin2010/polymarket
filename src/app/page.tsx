"use client";

import { useState, useEffect, useCallback } from "react";
import { GammaMarket, GammaEvent, HotListTopic, UserData } from "@/lib/types";
import HotEventCard from "@/components/HotEventCard";
import HotListTabs from "@/components/HotListTabs";

function marketToEvent(market: GammaMarket): GammaEvent {
  return {
    id: market.id,
    title: market.question,
    slug: market.slug,
    description: market.description,
    startDate: "",
    endDate: market.endDate,
    image: market.image,
    icon: market.icon,
    active: market.active,
    closed: market.closed,
    archived: market.archived,
    volume: parseFloat(market.volume) || 0,
    volume24hr: 0,
    liquidity: parseFloat(market.liquidity) || 0,
    markets: [market],
    tags: market.tags,
  };
}

export default function Home() {
  const [userData, setUserData] = useState<UserData>({
    myList: [],
    archived: [],
  });
  const [hotEvents, setHotEvents] = useState<GammaEvent[]>([]);
  const [activeTopic, setActiveTopic] = useState<HotListTopic>("politics");
  const [loadingHot, setLoadingHot] = useState(true);
  const [myListEvents, setMyListEvents] = useState<GammaEvent[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<GammaEvent[]>([]);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Fetch user data
  useEffect(() => {
    fetch("/api/user-data")
      .then((res) => res.json())
      .then(setUserData)
      .catch(console.error);
  }, []);

  // Fetch event data for My List items
  useEffect(() => {
    if (userData.myList.length === 0) {
      setMyListEvents([]);
      return;
    }
    Promise.all(
      userData.myList.map((item) => {
        if (item.eventSlug) {
          return fetch(`/api/events?slug=${encodeURIComponent(item.eventSlug)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((events: GammaEvent[] | null) => events?.[0] ?? null)
            .catch(() => null);
        }
        return fetch(`/api/markets/${item.marketId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((market: GammaMarket | null) => (market ? marketToEvent(market) : null))
          .catch(() => null);
      })
    ).then((results) => setMyListEvents(results.filter(Boolean) as GammaEvent[]));
  }, [userData.myList]);

  // Fetch event data for Archived items
  useEffect(() => {
    if (userData.archived.length === 0) {
      setArchivedEvents([]);
      return;
    }
    Promise.all(
      userData.archived.map((item) => {
        if (item.eventSlug) {
          return fetch(`/api/events?slug=${encodeURIComponent(item.eventSlug)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((events: GammaEvent[] | null) => events?.[0] ?? null)
            .catch(() => null);
        }
        return fetch(`/api/markets/${item.marketId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((market: GammaMarket | null) => (market ? marketToEvent(market) : null))
          .catch(() => null);
      })
    ).then((results) => setArchivedEvents(results.filter(Boolean) as GammaEvent[]));
  }, [userData.archived]);

  // Fetch hot markets via events API
  const fetchHot = useCallback(async (topic: HotListTopic) => {
    setLoadingHot(true);
    try {
      const topicTagMap: Record<HotListTopic, string> = {
        politics: "politics",
        tech: "ai",
        finance: "economy",
        breaking: "elections",
        new: "sports",
        iran: "iran",
      };

      const url = new URL("/api/events", window.location.origin);
      url.searchParams.set("tag_slug", topicTagMap[topic]);
      url.searchParams.set("limit", "10");
      url.searchParams.set("active", "true");
      url.searchParams.set("closed", "false");
      url.searchParams.set("order", "volume24hr");
      url.searchParams.set("ascending", "false");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed");
      const events: GammaEvent[] = await res.json();

      setHotEvents(events.filter((e) => e.markets && e.markets.length > 0));
    } catch {
      setHotEvents([]);
    }
    setLoadingHot(false);
  }, []);

  useEffect(() => {
    fetchHot(activeTopic);
  }, [activeTopic, fetchHot]);

  function handleTopicChange(topic: HotListTopic) {
    setActiveTopic(topic);
  }

  async function handleManualAdd() {
    const raw = addInput.trim();
    if (!raw) return;
    setAddLoading(true);
    setAddError("");

    // Accept full URL or bare slug
    const slugMatch = raw.match(/polymarket\.com\/event\/([^/?#]+)/);
    const slug = slugMatch ? slugMatch[1] : raw;

    try {
      const res = await fetch(`/api/events?slug=${encodeURIComponent(slug)}`);
      const events: GammaEvent[] = res.ok ? await res.json() : [];
      const event = events[0];
      const market = event?.markets?.[0];

      if (!market) {
        setAddError("Can't find the event");
        setAddLoading(false);
        return;
      }

      // If already archived, restore it (preserves notes, analyses, eventSlug)
      const isArchived = userData.archived.some((i) => i.marketId === market.id);
      const action = isArchived ? "restore" : "add";
      await fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, marketId: market.id, eventSlug: event.slug }),
      });

      // Refresh user data so My List updates
      const updated = await fetch("/api/user-data").then((r) => r.json());
      setUserData(updated);
      setAddInput("");
    } catch {
      setAddError("Can't find the event");
    }
    setAddLoading(false);
  }

  return (
    <div>
      {/* Main content: My List + Hot List */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* My List */}
        <section className="w-full lg:w-3/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">My List</h2>
          </div>

          {/* Manual add */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={addInput}
                onChange={(e) => { setAddInput(e.target.value); setAddError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                placeholder="Paste Polymarket event URL or slug…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
              />
              <button
                onClick={handleManualAdd}
                disabled={addLoading || !addInput.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {addLoading ? "Adding…" : "Add"}
              </button>
            </div>
            {addError && (
              <p className="mt-1.5 text-xs text-red-500">{addError}</p>
            )}
          </div>

          {myListEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No markets in your list yet. Browse the Hot List and add markets
              you want to track.
            </div>
          ) : (
            <div className="space-y-3">
              {myListEvents.map((event, idx) => {
                const myItem = userData.myList[idx];
                const marketId = myItem?.marketId ?? event.markets[0]?.id;
                return (
                  <HotEventCard
                    key={marketId}
                    event={event}
                    customHref={`/my/${marketId}`}
                    priceAlert={myItem?.priceAlert}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Hot List */}
        <section className="w-full border-t border-gray-200 pt-6 lg:w-2/5 lg:border-t-0 lg:pt-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Hot List</h2>
          </div>
          <HotListTabs active={activeTopic} onChange={handleTopicChange} />
          <div className="mt-4">
            {loadingHot ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg bg-gray-200"
                  />
                ))}
              </div>
            ) : hotEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No hot markets found for this topic.
              </div>
            ) : (
              (() => {
                const myListIds = new Set(userData.myList.map((i) => i.marketId));
                const archivedIds = new Set(userData.archived.map((i) => i.marketId));
                const filtered = hotEvents.filter(
                  (e) => !e.markets.some((m) => myListIds.has(m.id))
                );
                return filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    All events in this topic are already in your list.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((event) => (
                      <HotEventCard
                        key={event.id}
                        event={event}
                        isArchived={event.markets.some((m) => archivedIds.has(m.id))}
                      />
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </section>
      </div>

      {/* Archived section */}
      {archivedEvents.length > 0 && (
        <section className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Archived</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedEvents.map((event, idx) => {
              const archivedItem = userData.archived[idx];
              const marketId = archivedItem?.marketId ?? event.markets[0]?.id;
              return (
                <HotEventCard
                  key={marketId}
                  event={event}
                  customHref={`/archived/${marketId}`}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
