import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { CreditCard, Lock, LogOut, ShieldAlert } from "lucide-react";

import { PromptCompressor } from "@/components/PromptCompressor";
import { PricingCards } from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/auth-cookie";
import { getUsageSnapshot, hasActiveSubscription } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard | Prompt Shrinker",
  description: "Compress prompts with team usage tracking and subscription-gated access."
};

function LogoutButton() {
  return (
    <form action="/api/logout" method="post">
      <Button type="submit" variant="outline" size="sm">
        <LogOut className="mr-2 h-4 w-4" />
        Clear Session
      </Button>
    </form>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(token);

  if (!access) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Access Required
            </Badge>
            <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
              <Lock className="h-5 w-5 text-cyan-300" />
              Dashboard is paywalled
            </CardTitle>
            <CardDescription>
              Start checkout, then unlock this dashboard with the same billing email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingCards />
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Back to landing page
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const subscriptionActive = await hasActiveSubscription(access.email);

  if (!subscriptionActive) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Billing issue
            </Badge>
            <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              Subscription not active for {access.email}
            </CardTitle>
            <CardDescription>
              Complete checkout or wait for webhook sync, then unlock access again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              If you just paid, Lemon Squeezy usually syncs within 30 seconds. Click Unlock Dashboard again on the pricing card.
            </div>
            <PricingCards />
            <div className="flex flex-wrap gap-2">
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                Back to Home
              </Link>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const usage = await getUsageSnapshot(access.email);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge className="mb-2">Subscriber Dashboard</Badge>
          <h1 className="text-3xl font-semibold text-white">Prompt Shrinker Tooling</h1>
          <p className="mt-1 text-sm text-slate-300">Compress prompts, reduce token spend, and keep output quality intact.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pricing
          </Link>
          <LogoutButton />
        </div>
      </header>

      <PromptCompressor email={access.email} usage={usage} />
    </main>
  );
}
