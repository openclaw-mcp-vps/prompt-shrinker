import { NextRequest, NextResponse } from "next/server";

import { setSubscriptionStatus } from "@/lib/db";
import { extractWebhookDetails, mapLemonStatusToInternal, verifyLemonWebhookSignature, type LemonWebhookPayload } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as LemonWebhookPayload;
    const details = extractWebhookDetails(payload);

    if (!details.email) {
      return NextResponse.json({ ok: true, ignored: true, reason: "No customer email in event payload" });
    }

    const mappedStatus = mapLemonStatusToInternal(details.status, details.eventName);

    await setSubscriptionStatus({
      email: details.email,
      status: mappedStatus,
      customerId: details.customerId,
      subscriptionId: details.subscriptionId,
      currentPeriodEnd: details.currentPeriodEnd
    });

    return NextResponse.json({ ok: true, event: details.eventName, status: mappedStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed"
      },
      { status: 500 }
    );
  }
}
