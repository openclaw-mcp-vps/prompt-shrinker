import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, CircleDollarSign, Gauge, ShieldCheck, Zap } from "lucide-react";

import { AccessClaimForm } from "@/components/AccessClaimForm";
import { PricingTable } from "@/components/PricingTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, parseSessionToken } from "@/lib/auth";
import { getStripePaymentLink } from "@/lib/lemonsqueezy";

const faqs = [
  {
    q: "How does Prompt Shrinker preserve quality while cutting tokens?",
    a: "The compressor keeps intent, constraints, format instructions, and critical context. It removes repetition, soft language, and unnecessary verbosity that consumes tokens without improving outputs."
  },
  {
    q: "Do we have to switch from GPT to Claude or vice versa?",
    a: "No. Prompt Shrinker works with both. You can choose OpenAI or Anthropic in the dashboard or let the tool auto-select based on your API keys."
  },
  {
    q: "How does paywall access work?",
    a: "Checkout runs on Stripe hosted payment links. After payment, the Stripe webhook marks your email as active and the unlock form issues your secure access cookie."
  },
  {
    q: "Can we use it in internal tooling?",
    a: "Yes. The paid plan includes API access so teams can run compression in CI pipelines, prompt libraries, and internal dev tools."
  }
];

const problemCards = [
  {
    icon: CircleDollarSign,
    title: "Token Waste Scales Fast",
    body: "Teams with active assistants waste budget on bloated prompts. A 30-line prompt repeated thousands of times can burn hundreds of dollars per month."
  },
  {
    icon: Gauge,
    title: "CLI Tools Don’t Fit Teams",
    body: "Existing prompt compression tools are mostly CLI-first. Product teams need a simple UI, usage visibility, and a shared hosted workflow."
  },
  {
    icon: ShieldCheck,
    title: "Manual Edits Are Risky",
    body: "Hand-trimming prompts can break requirements and degrade output quality. Prompt Shrinker preserves constraints while aggressively trimming excess tokens."
  }
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  const paymentLink = getStripePaymentLink();

  return (
    <main className="pb-24">
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <header className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">ai-dev-tools</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-100 md:text-6xl">
            Prompt Shrinker.
            <span className="block bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Cut Claude/GPT token costs 40-70% automatically.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Paste any prompt and get a shorter version that keeps intent, constraints, and output shape.
            Designed for teams already spending $200+ per month on model APIs.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <a href={paymentLink} target="_blank" rel="noreferrer">
                <Button size="lg" className="w-full sm:w-auto">
                  Start for $9/month
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            {session
              ? `Signed in as ${session.email}`
              : "No credit card form on this site. Checkout runs through Stripe hosted payment links."}
          </p>
        </header>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-5 px-6 md:grid-cols-3">
        {problemCards.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="h-5 w-5 text-cyan-300" />
              <CardTitle className="mt-2 text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">{body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="how-it-works" className="mx-auto mt-16 max-w-6xl px-6">
        <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 1</p>
            <h3 className="mt-2 text-xl font-semibold">Paste Your Prompt</h3>
            <p className="mt-2 text-sm text-slate-300">
              Drop in long product, coding, or support prompts that currently cost too much.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 2</p>
            <h3 className="mt-2 text-xl font-semibold">AI Compression Engine</h3>
            <p className="mt-2 text-sm text-slate-300">
              We use OpenAI/Anthropic to preserve requirements while stripping redundant language.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 3</p>
            <h3 className="mt-2 text-xl font-semibold">Ship Lower-Cost Prompts</h3>
            <p className="mt-2 text-sm text-slate-300">
              Copy the optimized prompt, track usage limits, and push to your internal prompt library.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-6">
        <PricingTable paymentLink={paymentLink} />
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/50 p-6 px-6">
        <h2 className="text-2xl font-semibold">Unlock your paid workspace</h2>
        <p className="mt-2 text-sm text-slate-300">
          After checkout, use the same purchase email below. We set a secure cookie and send you straight to
          your dashboard.
        </p>
        <div className="mt-4">
          <AccessClaimForm />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="text-3xl font-semibold">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">{faq.a}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Ready to stop paying for prompt bloat?</h2>
            <p className="mt-1 text-sm text-slate-300">
              Prompt Shrinker is the fastest way for AI-heavy teams to lower inference costs without losing output quality.
            </p>
          </div>
          <a href={paymentLink} target="_blank" rel="noreferrer">
            <Button size="lg">
              <Zap className="mr-2 h-4 w-4" />
              Buy and Unlock
            </Button>
          </a>
        </div>
      </section>
    </main>
  );
}
