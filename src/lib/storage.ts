import { promises as fs } from "fs";
import path from "path";
import { UserData, MyListItem, ArchivedItem } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "user-data.json");

export async function readUserData(): Promise<UserData> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    const empty: UserData = { myList: [], archived: [] };
    await writeUserData(empty);
    return empty;
  }
}

export async function writeUserData(data: UserData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function addToMyList(marketId: string, eventSlug?: string): Promise<MyListItem> {
  const data = await readUserData();
  const existing = data.myList.find((item) => item.marketId === marketId);
  if (existing) return existing;

  const item: MyListItem = {
    marketId,
    eventSlug,
    addedAt: new Date().toISOString().split("T")[0],
    notes: "",
    priceAlert: null,
    analyses: [],
  };
  data.myList.push(item);
  await writeUserData(data);
  return item;
}

export async function archiveItem(marketId: string): Promise<ArchivedItem | null> {
  const data = await readUserData();
  const idx = data.myList.findIndex((item) => item.marketId === marketId);
  if (idx === -1) return null;

  const [removed] = data.myList.splice(idx, 1);
  const archived: ArchivedItem = {
    marketId: removed.marketId,
    eventSlug: removed.eventSlug,
    addedAt: removed.addedAt,
    notes: removed.notes,
    analyses: removed.analyses,
    archivedAt: new Date().toISOString().split("T")[0],
    summary: "",
  };
  data.archived.push(archived);
  await writeUserData(data);
  return archived;
}

export async function restoreItem(marketId: string): Promise<MyListItem | null> {
  const data = await readUserData();
  // Use last match — handles duplicates, picks the most recent (with eventSlug/analyses)
  const idx = data.archived.map((item, i) => ({ item, i }))
    .filter(({ item }) => item.marketId === marketId)
    .at(-1)?.i ?? -1;
  if (idx === -1) return null;

  // Remove all duplicates with this marketId, keep the last one's data
  const allMatches = data.archived.filter((item) => item.marketId === marketId);
  const best = allMatches[allMatches.length - 1];
  data.archived = data.archived.filter((item) => item.marketId !== marketId);

  const [removed] = [best];
  const restored: MyListItem = {
    marketId: removed.marketId,
    eventSlug: removed.eventSlug,
    addedAt: removed.addedAt,
    notes: removed.notes,
    priceAlert: null,
    analyses: removed.analyses,
  };
  data.myList.push(restored);
  await writeUserData(data);
  return restored;
}

export async function updateMyListItem(
  marketId: string,
  updates: Partial<Pick<MyListItem, "notes" | "priceAlert" | "analyses">>
): Promise<MyListItem | null> {
  const data = await readUserData();
  const item = data.myList.find((i) => i.marketId === marketId);
  if (!item) return null;

  if (updates.notes !== undefined) item.notes = updates.notes;
  if (updates.priceAlert !== undefined) item.priceAlert = updates.priceAlert;
  if (updates.analyses !== undefined) item.analyses = updates.analyses;

  await writeUserData(data);
  return item;
}
