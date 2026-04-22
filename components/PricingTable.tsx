import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PricingTableProps = {
  paymentLink: string;
};

const included = [
  "500 prompt shrinks per month",
  "OpenAI + Anthropic compression engine",
  "API access for internal tooling",
  "Team-friendly dashboard with usage tracking",
  "Fast support from builder team"
];

export function PricingTable({ paymentLink }: PricingTableProps) {
  return (
    <Card className="mx-auto w-full max-w-2xl border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-slate-950/70">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 inline-flex w-fit rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Simple Pricing
        </div>
        <CardTitle className="text-3xl">$9/month</CardTitle>
        <CardDescription className="text-slate-300">
          Built for AI-heavy teams spending more than $200/month on model calls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-slate-200">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <a href={paymentLink} target="_blank" rel="noreferrer" className="mt-6 block">
          <Button className="w-full" size="lg">
            Buy Prompt Shrinker
          </Button>
        </a>
        <p className="mt-3 text-center text-xs text-slate-400">
          Hosted Stripe checkout. Instant access unlock after payment confirmation.
        </p>
      </CardContent>
    </Card>
  );
}
