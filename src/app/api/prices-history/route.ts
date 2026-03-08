import { NextRequest, NextResponse } from "next/server";

const CLOB_BASE = "https://clob.polymarket.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = new URL(`${CLOB_BASE}/prices-history`);

  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { error: `CLOB API error: ${res.status}` },
      { status: res.status }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
