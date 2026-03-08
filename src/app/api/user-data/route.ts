import { NextRequest, NextResponse } from "next/server";
import {
  readUserData,
  addToMyList,
  archiveItem,
  restoreItem,
  updateMyListItem,
} from "@/lib/storage";

export async function GET() {
  const data = await readUserData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "add": {
      const item = await addToMyList(body.marketId, body.eventSlug);
      return NextResponse.json(item);
    }
    case "archive": {
      const archived = await archiveItem(body.marketId);
      if (!archived)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(archived);
    }
    case "restore": {
      const restored = await restoreItem(body.marketId);
      if (!restored)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(restored);
    }
    case "update": {
      const updated = await updateMyListItem(body.marketId, body.updates);
      if (!updated)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(updated);
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
