import { NextRequest, NextResponse } from "next/server";

import { saveCheckoutIntent } from "@/lib/db";
import { getCheckoutUrlForEmail } from "@/lib/lemonsqueezy";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.toLowerCase().trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    await saveCheckoutIntent(email);
    const checkoutUrl = getCheckoutUrlForEmail(email);

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to initialize checkout"
      },
      { status: 500 }
    );
  }
}
