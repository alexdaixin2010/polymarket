import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = new URL(`${GAMMA_BASE}/events`);

  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { error: `Gamma API error: ${res.status}` },
      { status: res.status }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
