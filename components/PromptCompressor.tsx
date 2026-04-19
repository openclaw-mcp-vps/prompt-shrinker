"use client";

import { useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Copy, Loader2, Scissors, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CompressionResponse = {
  compressedPrompt: string;
  summary: string;
  riskNotes: string;
  provider: "openai" | "anthropic" | "local";
  model: string;
  inputTokens: number;
  outputTokens: number;
  reductionPercent: number;
  usage: {
    month: string;
    limit: number;
    used: number;
    remaining: number;
    allowed: boolean;
  };
};

type PromptCompressorProps = {
  email: string;
  usage: {
    month: string;
    limit: number;
    used: number;
    remaining: number;
  };
};

const EXAMPLE_PROMPT = `You are a senior staff engineer and systems architect. Please generate a full migration plan that includes scope, milestones, rollback strategy, risk register, and communication plan for moving our monolith to microservices. Keep it practical for a team of 8 engineers and 1 PM. Provide weekly deliverables, owner mapping, and a realistic timeline.`;

export function PromptCompressor({ email, usage: initialUsage }: PromptCompressorProps) {
  const [sourcePrompt, setSourcePrompt] = useState(EXAMPLE_PROMPT);
  const [mode, setMode] = useState<"balanced" | "aggressive">("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompressionResponse | null>(null);
  const [usage, setUsage] = useState(initialUsage);

  const usageRatio = useMemo(() => {
    if (!usage.limit) {
      return 0;
    }

    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  }, [usage]);

  const compressPrompt = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sourcePrompt, mode })
      });

      const payload = (await response.json()) as CompressionResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Compression failed");
      }

      setResult(payload);
      setUsage(payload.usage);
    } catch (compressionError) {
      setError(compressionError instanceof Error ? compressionError.message : "Compression failed");
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async () => {
    if (!result?.compressedPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.compressedPrompt);
    } catch {
      setError("Could not copy to clipboard. Copy manually from the output pane.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan-500/20 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            <WandSparkles className="h-5 w-5 text-cyan-300" />
            Prompt Compressor
          </CardTitle>
          <CardDescription>
            Signed in as <span className="font-medium text-slate-100">{email}</span>. Active billing cycle: {usage.month}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
              <span>Monthly usage</span>
              <span>
                {usage.used}/{usage.limit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${usageRatio}%` }} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-slate-300" htmlFor="mode">
              Compression mode
            </label>
            <select
              id="mode"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={mode}
              onChange={(event) => setMode(event.target.value as "balanced" | "aggressive")}
            >
              <option value="balanced">Balanced (safer wording)</option>
              <option value="aggressive">Aggressive (max savings)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="source-prompt">
              Prompt to shrink
            </label>
            <TextareaAutosize
              id="source-prompt"
              minRows={8}
              value={sourcePrompt}
              onChange={(event) => setSourcePrompt(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              placeholder="Paste your verbose prompt here..."
            />
          </div>

          <Button onClick={compressPrompt} disabled={loading || !sourcePrompt.trim()} size="lg" className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4" />}
            Compress Prompt
          </Button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-lg">
            <span>Compressed output</span>
            <Button variant="outline" size="sm" onClick={copyOutput} disabled={!result?.compressedPrompt}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy
            </Button>
          </CardTitle>
          <CardDescription>Use this optimized prompt directly in GPT/Claude calls.</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{result.reductionPercent}% smaller</Badge>
                <Badge variant="secondary">{result.provider}</Badge>
                <Badge variant="outline">{result.model}</Badge>
                <Badge variant="secondary">
                  {result.inputTokens} → {result.outputTokens} tokens
                </Badge>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{result.compressedPrompt}</pre>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">What changed</p>
                  <p className="mt-2 text-sm text-slate-200">{result.summary}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Quality watchout</p>
                  <p className="mt-2 text-sm text-slate-200">{result.riskNotes}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Run a compression to see results and token savings.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
