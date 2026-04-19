import crypto from "node:crypto";

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      email?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      user_email?: string;
      customer_email?: string;
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
    };
    relationships?: {
      customer?: {
        data?: {
          id?: string;
        };
      };
      subscription?: {
        data?: {
          id?: string;
        };
      };
    };
  };
};

export function getCheckoutUrlForEmail(email: string) {
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!storeId) {
    throw new Error("NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID is missing");
  }

  if (!productId) {
    throw new Error("NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is missing");
  }

  const url = new URL(`https://app.lemonsqueezy.com/checkout/buy/${productId}`);
  url.searchParams.set("checkout[email]", email);
  url.searchParams.set("checkout[custom][email]", email);
  url.searchParams.set("checkout[custom][source]", "prompt-shrinker");
  url.searchParams.set("checkout[custom][store_id]", storeId);
  return url.toString();
}

export function verifyLemonWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function extractWebhookDetails(payload: LemonWebhookPayload) {
  const eventName = payload.meta?.event_name || "unknown";
  const status = payload.data?.attributes?.status;

  const email =
    payload.meta?.custom_data?.email ||
    payload.data?.attributes?.user_email ||
    payload.data?.attributes?.customer_email ||
    null;

  const customerId = payload.data?.relationships?.customer?.data?.id;
  const subscriptionId = payload.data?.relationships?.subscription?.data?.id || payload.data?.id;
  const currentPeriodEnd =
    payload.data?.attributes?.renews_at || payload.data?.attributes?.trial_ends_at || payload.data?.attributes?.ends_at;

  return {
    eventName,
    email,
    status,
    customerId,
    subscriptionId,
    currentPeriodEnd
  };
}

export function mapLemonStatusToInternal(status: string | undefined, eventName: string): SubscriptionStatus {
  const normalizedStatus = status?.toLowerCase().trim();
  const normalizedEvent = eventName.toLowerCase().trim();

  if (normalizedStatus === "active" || normalizedStatus === "on_trial") {
    return normalizedStatus;
  }

  if (
    normalizedEvent.includes("subscription_created") ||
    normalizedEvent.includes("subscription_resumed") ||
    normalizedEvent.includes("order_created")
  ) {
    return "active";
  }

  if (
    normalizedStatus === "expired" ||
    normalizedStatus === "cancelled" ||
    normalizedEvent.includes("subscription_expired") ||
    normalizedEvent.includes("subscription_cancelled")
  ) {
    return "cancelled";
  }

  if (normalizedStatus === "past_due" || normalizedEvent.includes("payment_failed")) {
    return "past_due";
  }

  return "inactive";
}
import type { SubscriptionStatus } from "@/lib/db";
