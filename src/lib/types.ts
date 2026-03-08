// ── Polymarket API Response Types ──

export interface GammaMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
  endDate: string;
  closed: boolean;
  active: boolean;
  archived: boolean;
  image: string;
  icon: string;
  slug: string;
  conditionId: string;
  clobTokenIds: string;
  groupItemTitle: string | null;
  tags: GammaTag[];
}

export interface GammaTag {
  id: string;
  label: string;
  slug: string;
}

export interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  volume: number;
  volume24hr: number;
  liquidity: number;
  markets: GammaMarket[];
  tags: GammaTag[];
}

export interface PriceHistoryPoint {
  t: number; // unix timestamp
  p: number; // price 0-1
}

export interface PriceHistory {
  history: PriceHistoryPoint[];
}

// ── User Data Types ──

export type HotListTopic =
  | "politics"
  | "tech"
  | "finance"
  | "breaking"
  | "new"
  | "iran";

export interface PriceAlert {
  target: number; // 0-1
  direction: "above" | "below";
}

export interface AnalysisEntry {
  date: string; // ISO date
  content: string;
  summary: string;
  price: number | null; // probability 0-1 at time of analysis
}

export interface MyListItem {
  marketId: string;
  eventSlug?: string;
  addedAt: string;
  notes: string;
  priceAlert: PriceAlert | null;
  analyses: AnalysisEntry[];
}

export interface ArchivedItem {
  marketId: string;
  eventSlug?: string;
  addedAt: string;
  archivedAt: string;
  summary: string;
  notes: string;
  analyses: AnalysisEntry[];
}

export interface UserData {
  myList: MyListItem[];
  archived: ArchivedItem[];
}
