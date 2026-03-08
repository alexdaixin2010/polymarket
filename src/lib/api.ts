import { GammaEvent, GammaMarket, PriceHistory, HotListTopic } from "./types";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";

// ── Gamma API (market discovery) ──

export async function fetchEvents(params?: {
  tag?: string;
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<GammaEvent[]> {
  const url = new URL(`${GAMMA_BASE}/events`);
  if (params?.tag) url.searchParams.set("tag", params.tag);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  if (params?.active !== undefined)
    url.searchParams.set("active", String(params.active));
  if (params?.closed !== undefined)
    url.searchParams.set("closed", String(params.closed));
  if (params?.order) url.searchParams.set("order", params.order);
  if (params?.ascending !== undefined)
    url.searchParams.set("ascending", String(params.ascending));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function fetchEvent(id: string): Promise<GammaEvent> {
  const res = await fetch(`${GAMMA_BASE}/events/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function fetchMarket(id: string): Promise<GammaMarket> {
  const res = await fetch(`${GAMMA_BASE}/markets/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function fetchMarkets(params?: {
  tag_slug?: string;
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  end_date_min?: string;
  end_date_max?: string;
}): Promise<GammaMarket[]> {
  const url = new URL(`${GAMMA_BASE}/markets`);
  if (params?.tag_slug) url.searchParams.set("tag_slug", params.tag_slug);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  if (params?.active !== undefined)
    url.searchParams.set("active", String(params.active));
  if (params?.closed !== undefined)
    url.searchParams.set("closed", String(params.closed));
  if (params?.order) url.searchParams.set("order", params.order);
  if (params?.ascending !== undefined)
    url.searchParams.set("ascending", String(params.ascending));
  if (params?.end_date_min)
    url.searchParams.set("end_date_min", params.end_date_min);
  if (params?.end_date_max)
    url.searchParams.set("end_date_max", params.end_date_max);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

// ── CLOB API (price data) ──

export async function fetchPriceHistory(
  tokenId: string,
  interval: "1h" | "6h" | "1d" | "1w" | "1m" | "max" | "all" = "1m"
): Promise<PriceHistory> {
  const url = new URL(`${CLOB_BASE}/prices-history`);
  url.searchParams.set("market", tokenId);
  url.searchParams.set("interval", interval);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

export async function fetchCurrentPrice(
  tokenId: string
): Promise<{ price: string }> {
  const url = new URL(`${CLOB_BASE}/price`);
  url.searchParams.set("token_id", tokenId);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  return res.json();
}

// ── Hot List topic → Gamma tag mapping ──

const TOPIC_TAG_MAP: Record<HotListTopic, string> = {
  politics: "politics",
  tech: "technology",
  finance: "finance",
  breaking: "breaking",
  new: "new",
  iran: "iran",
};

export async function fetchHotMarkets(
  topic: HotListTopic
): Promise<GammaMarket[]> {
  const now = new Date();
  const threeMonths = new Date(now);
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  return fetchMarkets({
    tag_slug: TOPIC_TAG_MAP[topic],
    limit: 10,
    active: true,
    closed: false,
    order: "volume",
    ascending: false,
    end_date_max: threeMonths.toISOString(),
  });
}
