export function formatVolume(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatProbability(price: number): string {
  return `${Math.round(price * 100)}%`;
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  const end = new Date(isoDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function parseOutcomes(market: {
  outcomes: string;
  outcomePrices: string;
}): { name: string; price: number }[] {
  try {
    const names: string[] = JSON.parse(market.outcomes);
    const prices: string[] = JSON.parse(market.outcomePrices);
    return names.map((name, i) => ({
      name,
      price: parseFloat(prices[i]) || 0,
    }));
  } catch {
    return [];
  }
}

export function getClobTokenIds(market: { clobTokenIds: string }): string[] {
  try {
    return JSON.parse(market.clobTokenIds);
  } catch {
    return [];
  }
}
