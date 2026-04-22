import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PromptShrinker } from "@/components/PromptShrinker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, parseSessionToken } from "@/lib/auth";
import { getUsageStats, hasActiveEntitlement } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const session = parseSessionToken(sessionToken);

  if (!session) {
    redirect("/");
  }

  const entitled = await hasActiveEntitlement(session.email);
  if (!entitled) {
    redirect("/?access=inactive");
  }

  const usage = await getUsageStats(session.email);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Prompt Shrinker</p>
          <h1 className="mt-2 text-3xl font-semibold">Compression Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Signed in as {session.email}. Monthly usage: {usage.used}/{usage.limit}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="secondary">Back to Landing</Button>
          </Link>
          <a href="/api/access/logout">
            <Button variant="ghost">Sign Out</Button>
          </a>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">This Month’s Quota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-slate-400">Used</p>
              <p className="text-xl font-semibold">{usage.used}</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-slate-400">Remaining</p>
              <p className="text-xl font-semibold text-cyan-300">{usage.remaining}</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-slate-400">Billing Month</p>
              <p className="text-xl font-semibold">{usage.month}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PromptShrinker />
    </main>
  );
}
