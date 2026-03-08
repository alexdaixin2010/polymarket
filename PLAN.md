# Polymarket — Personal Prediction Market Dashboard

## Context

Build a Next.js dashboard for tracking Polymarket prediction markets. This is a personal tool — not a general market browser. The user curates a watchlist ("My List"), archives items they're done with, and discovers new markets via a "Hot List" sourced from Polymarket's API. Each My List item gets daily AI analysis powered by Claude. Trade tracking deferred to a later phase.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Charts**: Recharts
- **AI**: Claude API (`@anthropic-ai/sdk`) for daily market analysis
- **Data source**: Polymarket Gamma API + CLOB API (no auth, read-only)
- **Storage**: JSON file on disk (via Next.js API routes)

## Home Page Layout

```
┌─────────────────────────────────┬──────────────────────┐
│          MY LIST (60%)          │   HOT LIST (40%)     │
│                                 │                      │
│  - Market card                  │  [Politics] [Tech]   │
│  - Market card                  │  [Finance] [Breaking]│
│  - Market card (alert badge     │  [New]               │
│    if price crosses target)     │                      │
│                                 │  - Hot item 1        │
│                                 │  - Hot item 2        │
│                                 │  - ...top 10         │
├─────────────────────────────────┴──────────────────────┤
│                 ARCHIVED (bottom)                       │
│  - Archived item 1  - Archived item 2  - ...           │
└────────────────────────────────────────────────────────┘
```

### My List (left, 60%)
- Personal curated markets saved from Hot List
- Each card shows: title, current probability, volume, close date
- Price alert indicator: card shows visual badge when probability crosses user-set target
- Click → navigates to My List detail page

### Hot List (right, 40%)
- Tabs: Politics | Tech | Finance | Breaking | New
- Shows top 10 markets per topic by traffic/volume
- Filtered to markets closing within 3 months
- Click → navigates to Hot List detail page

### Archived (bottom)
- Items removed from My List
- Click → navigates to Archived detail page

## Three Detail Pages

### 1. Hot List Detail (`/hot/[id]`)
- Price/probability chart (Recharts area chart)
- Market description & resolution criteria
- Volume & liquidity stats
- "Add to My List" button

### 2. My List Detail (`/my/[id]`)
Everything from Hot List detail, plus:
- AI Daily Analysis section: daily Claude-generated analysis persisted by date
- Personal notes/annotations
- Price alert target
- Archive button

### 3. Archived Detail (`/archived/[id]`)
- Summary section at top: overall AI analysis summary
- No new daily AI updates
- Historical analysis entries (read-only)
- Restore to My List button

## Future
- Trade tracking (manual entry + wallet integration)
- WebSocket for real-time prices
- Scheduled/automatic daily AI analysis (cron)
- Browser notifications for price alerts
