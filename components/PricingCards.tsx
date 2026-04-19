"use client";

import { useState } from "react";
import { Loader2, Sparkles, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open?: (url: string) => void;
      };
    };
  }
}

export function PricingCards() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"neutral" | "success" | "error">("neutral");

  const requestCheckout = async () => {
    setBusy(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || "Could not start checkout");
      }

      setStatusTone("neutral");
      setStatusMessage("Checkout is open. Complete payment, then click Unlock below.");

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(payload.checkoutUrl);
      } else {
        window.location.href = payload.checkoutUrl;
      }
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  const unlockDashboard = async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Purchase not detected yet");
      }

      setStatusTone("success");
      setStatusMessage("Access unlocked. Redirecting to your dashboard...");
      window.location.href = "/dashboard";
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(
        error instanceof Error
          ? `${error.message}. If you just paid, wait 20-30 seconds for webhook sync then try again.`
          : "Unable to unlock access"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950/90">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="default">
            Launch Pricing
          </Badge>
          <CardTitle className="text-3xl">$9 / month</CardTitle>
          <CardDescription className="text-base text-slate-300">
            Unlimited seats, pooled usage, and monthly prompt optimization credits for your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <span>300 high-quality compressions per month included</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <span>OpenAI and Anthropic-backed optimization engine</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <span>Webhook-verified subscription access and usage controls</span>
            </li>
          </ul>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="pricing-email">
              Work email used at checkout
            </label>
            <Input
              id="pricing-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={requestCheckout} disabled={busy || !email.includes("@")} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Open Checkout
            </Button>
            <Button
              onClick={unlockDashboard}
              disabled={busy || !email.includes("@")} 
              variant="secondary"
              className="w-full"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Unlock Dashboard
            </Button>
          </div>

          {statusMessage ? (
            <p
              className={
                statusTone === "error"
                  ? "text-sm text-rose-300"
                  : statusTone === "success"
                    ? "text-sm text-emerald-300"
                    : "text-sm text-slate-300"
              }
            >
              {statusMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ROI snapshot</CardTitle>
          <CardDescription>Teams running high-volume generation loops usually recover cost on day one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Before Prompt Shrinker</p>
            <p className="mt-1 text-2xl font-semibold text-rose-200">$420 / month</p>
            <p className="mt-2">Verbose internal prompts repeated across assistants and tooling scripts.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">After Prompt Shrinker</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-200">$189 / month</p>
            <p className="mt-2">Same output quality, tighter instructions, and lower latency under load.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
