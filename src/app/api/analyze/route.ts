import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readUserData, writeUserData } from "@/lib/storage";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { marketId, marketTitle, marketDescription, currentPrice, userPrompt, userNotes } =
    await req.json();

  if (!marketId || !marketTitle) {
    return NextResponse.json(
      { error: "marketId and marketTitle are required" },
      { status: 400 }
    );
  }

  const userData = await readUserData();
  const myItem = userData.myList.find((i) => i.marketId === marketId);
  if (!myItem) {
    return NextResponse.json(
      { error: "Market not in My List" },
      { status: 404 }
    );
  }

  const history = [...myItem.analyses]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => {
      const priceStr = a.price != null ? ` (${Math.round(a.price * 100)}%)` : "";
      return `[${a.date}${priceStr}]\nSummary: ${a.summary || "(none)"}\n${a.content}`;
    })
    .join("\n\n---\n\n");

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are a prediction market analyst. Use all the context below to inform your analysis.

## Market
${marketTitle}

## Resolution Criteria
${marketDescription || "N/A"}

## Current Probability
${currentPrice != null ? `${Math.round(currentPrice * 100)}%` : "N/A"}
${userNotes?.trim() ? `\n## My Notes\n${userNotes.trim()}` : ""}
${history ? `\n## Analysis History (oldest → newest)\n${history}` : "\nNo previous analyses."}`;

  const userMessage = userPrompt?.trim()
    ? userPrompt.trim()
    : `Provide a brief (2-3 paragraph) analysis covering:
1. Current market sentiment and probability assessment
2. Key factors driving this market based on the resolution criteria
3. Notable changes or trends compared to previous analyses (if any)

Be concise, data-driven, and actionable.`;

  // Generate full analysis
  const analysisMsg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const analysisContent =
    analysisMsg.content[0].type === "text" ? analysisMsg.content[0].text : "";

  // Generate one-line summary
  const summaryMsg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    system: `You summarize prediction market analyses into a single concise sentence (max 20 words). Include the current probability if available.`,
    messages: [
      {
        role: "user",
        content: `Summarize this analysis in one sentence:\n\n${analysisContent}`,
      },
    ],
  });
  const summary =
    summaryMsg.content[0].type === "text" ? summaryMsg.content[0].text.trim() : "";

  const entry = {
    date: today,
    content: analysisContent,
    summary,
    price: currentPrice ?? null,
  };

  myItem.analyses.push(entry);
  await writeUserData(userData);

  return NextResponse.json(entry);
}
