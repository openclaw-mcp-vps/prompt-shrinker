import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { shrinkPrompt } from "@/lib/ai";
import { ACCESS_COOKIE_NAME, parseSessionToken } from "@/lib/auth";
import { getUsageStats, hasActiveEntitlement, incrementUsage } from "@/lib/db";

export const runtime = "nodejs";

type ShrinkRequestBody = {
  prompt?: string;
  provider?: "auto" | "openai" | "anthropic";
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const session = parseSessionToken(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const entitled = await hasActiveEntitlement(session.email);
  if (!entitled) {
    return NextResponse.json(
      { error: "No active subscription found. Please complete checkout first." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as ShrinkRequestBody | null;
  const prompt = body?.prompt?.trim() || "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (prompt.length > 12000) {
    return NextResponse.json({ error: "Prompt is too long. Maximum length is 12,000 characters." }, { status: 400 });
  }

  const currentUsage = await getUsageStats(session.email);
  if (currentUsage.used >= currentUsage.limit) {
    return NextResponse.json(
      {
        error: `Monthly limit reached (${currentUsage.limit}). Upgrade or wait for next billing month.`,
        usage: currentUsage
      },
      { status: 429 }
    );
  }

  try {
    const result = await shrinkPrompt(prompt, body?.provider === "auto" ? undefined : body?.provider);
    const updatedUsage = await incrementUsage(session.email);

    return NextResponse.json({
      ...result,
      usage: updatedUsage
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Prompt compression failed. Check provider keys and try again."
      },
      { status: 500 }
    );
  }
}
