import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, createAccessToken, getAccessCookieMaxAgeSeconds } from "@/lib/auth-cookie";
import { hasActiveSubscription } from "@/lib/db";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.toLowerCase().trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const isActive = await hasActiveSubscription(email);

    if (!isActive) {
      return NextResponse.json({ error: "No active subscription found for this email." }, { status: 403 });
    }

    const token = createAccessToken(email);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getAccessCookieMaxAgeSeconds()
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not unlock dashboard"
      },
      { status: 500 }
    );
  }
}
