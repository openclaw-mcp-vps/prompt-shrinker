import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { upsertEntitlement } from "@/lib/db";

export const runtime = "nodejs";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
}

async function extractCustomerEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email || session.customer_email || null;
}

export async function POST(request: Request) {
  const stripeSignature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSignature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature header or STRIPE_WEBHOOK_SECRET." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? `Webhook signature verification failed: ${error.message}` : "Invalid webhook signature."
      },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = await extractCustomerEmail(session);
      if (email) {
        await upsertEntitlement(email, true, `stripe_checkout:${session.id}`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const email = subscription.metadata?.email;
      if (email) {
        await upsertEntitlement(email, false, `stripe_subscription_deleted:${subscription.id}`);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const email = subscription.metadata?.email;
      if (email) {
        const active = subscription.status === "active" || subscription.status === "trialing";
        await upsertEntitlement(email, active, `stripe_subscription_updated:${subscription.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed."
      },
      { status: 500 }
    );
  }
}
