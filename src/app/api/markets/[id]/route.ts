import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${GAMMA_BASE}/markets/${id}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: `Gamma API error: ${res.status}` },
      { status: res.status }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
