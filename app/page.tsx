import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, DollarSign, Gauge, ShieldCheck, Sparkles, TimerReset } from "lucide-react";

import { PricingCards } from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Prompt Shrinker — cut Claude/GPT token costs 40-70% automatically",
  description:
    "Web UI + API for teams to compress prompts with OpenAI/Anthropic-backed rewriting and subscription billing via Lemon Squeezy."
};

const faqItems = [
  {
    question: "How does Prompt Shrinker keep output quality while removing tokens?",
    answer:
      "The compressor model is instructed to preserve hard constraints, expected output format, and acceptance criteria while removing repetition and loose phrasing. You also get risk notes for quick QA before rollout."
  },
  {
    question: "Can my team use this for system prompts and eval prompts?",
    answer:
      "Yes. The dashboard is designed for engineering teams who run prompts in production pipelines, test harnesses, and internal agent tooling."
  },
  {
    question: "What happens when I hit the monthly usage limit?",
    answer:
      "API calls are rejected until the next billing cycle. We expose your current usage in the dashboard so you can monitor runway in real time."
  },
  {
    question: "Do I need both OpenAI and Anthropic keys configured?",
    answer:
      "No. If one provider key is present, Prompt Shrinker uses it. If both exist, OpenAI is used first by default."
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-4">
          <div className="font-['var(--font-plex-mono)'] text-sm tracking-wide text-cyan-200">prompt-shrinker</div>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Open Dashboard
          </Link>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit">AI Dev Tools</Badge>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Prompt Shrinker
              <span className="mt-2 block text-cyan-300">cut Claude/GPT token costs 40-70% automatically</span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Paste any prompt and get a compressed, production-ready version in seconds. Keep output quality. Cut spend.
              Move faster.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#pricing" className={buttonVariants({ size: "lg" })}>
                Start for $9/month
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "secondary" })}>
                Go to Compressor
              </Link>
            </div>
            <p className="text-sm text-slate-400">Built for AI-heavy teams spending $200+/month on model APIs.</p>
          </div>

          <Card className="border-cyan-400/20 bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-xl">Why teams switch from CLI-only tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="font-medium text-white">Problem</p>
                <p className="mt-1">CLI workflows do not fit non-technical users and are hard to standardize across teams.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="font-medium text-white">Hosted wedge</p>
                <p className="mt-1">Web UI + API + billing means anyone on your team can optimize prompts and track usage.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">The cost leak you can fix this week</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-emerald-300" />
                  Hidden token waste
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Prompts are often 2-3x longer than needed. You pay for every token, every request, every day.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TimerReset className="h-4 w-4 text-cyan-300" />
                  Slow iteration cycles
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Manual prompt cleanup is tedious and inconsistent. Engineers stop doing it even when costs climb.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4 text-violet-300" />
                  No team-level controls
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Without hosted access control and usage caps, optimization gets stuck as ad-hoc individual work.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">How Prompt Shrinker works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-base">1. Paste the original prompt</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Drop in system prompts, agent tasks, or one-off generation instructions.
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-base">2. AI rewrites for density</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                OpenAI/Anthropic-based rewriting keeps constraints while reducing token footprint.
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-base">3. Ship and monitor usage</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Use the optimized prompt immediately and track monthly optimization usage per account.
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="pricing" className="mt-20 scroll-mt-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Simple pricing for AI-heavy teams</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            One plan, one job: reduce recurring token spend without sacrificing output quality.
          </p>
          <div className="mt-6">
            <PricingCards />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question}>
                <CardHeader>
                  <CardTitle className="text-base">{item.question}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">{item.answer}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-['var(--font-plex-mono)'] text-xs uppercase tracking-widest text-cyan-300">Ready to shrink spend?</p>
              <h3 className="mt-2 text-2xl font-semibold">Start compressing prompts in under 2 minutes.</h3>
            </div>
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              Open Dashboard
              <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-900/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Prompt Shrinker</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Dark-mode only by design.
          </p>
        </div>
      </footer>
    </main>
  );
}
