import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/"
  });
  return response;
}
