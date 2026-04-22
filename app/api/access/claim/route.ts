import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { hasActiveEntitlement } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() || "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      {
        status: 400
      }
    );
  }

  const entitled = await hasActiveEntitlement(email);
  if (!entitled) {
    return NextResponse.json(
      {
        error:
          "No active payment found for this email yet. Complete checkout and wait ~10s for webhook processing."
      },
      { status: 403 }
    );
  }

  const token = createSessionToken(email);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 32
  });

  return response;
}
