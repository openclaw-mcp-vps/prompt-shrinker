import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken, ACCESS_COOKIE_NAME } from "@/lib/auth-cookie";
import { compressPrompt, type CompressionMode } from "@/lib/ai-providers";
import { getUsageSnapshot, hasActiveSubscription, incrementUsage } from "@/lib/db";

export const runtime = "nodejs";

function isValidMode(mode: string): mode is CompressionMode {
  return mode === "balanced" || mode === "aggressive";
}

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const access = verifyAccessToken(cookieToken);

    if (!access) {
      return NextResponse.json({ error: "Not authorized. Please unlock dashboard first." }, { status: 401 });
    }

    const subscriptionActive = await hasActiveSubscription(access.email);
    if (!subscriptionActive) {
      return NextResponse.json({ error: "Subscription inactive. Complete checkout to continue." }, { status: 402 });
    }

    const body = (await request.json()) as { prompt?: string; mode?: string };
    const prompt = body.prompt?.trim();
    const mode = body.mode?.toLowerCase() || "balanced";

    if (!prompt || prompt.length < 20) {
      return NextResponse.json({ error: "Prompt must be at least 20 characters." }, { status: 400 });
    }

    if (prompt.length > 40000) {
      return NextResponse.json({ error: "Prompt exceeds max supported size (40,000 chars)." }, { status: 413 });
    }

    if (!isValidMode(mode)) {
      return NextResponse.json({ error: "Invalid mode. Use balanced or aggressive." }, { status: 400 });
    }

    const usageBefore = await getUsageSnapshot(access.email);
    if (usageBefore.used >= usageBefore.limit) {
      return NextResponse.json(
        { error: "Monthly compression limit reached.", usage: { ...usageBefore, allowed: false } },
        { status: 429 }
      );
    }

    const result = await compressPrompt(prompt, mode);
    const usage = await incrementUsage(access.email);

    return NextResponse.json({
      ...result,
      usage
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Compression failed"
      },
      { status: 500 }
    );
  }
}
