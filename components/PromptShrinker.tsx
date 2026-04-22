"use client";

import { useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ShrinkResult = {
  compressedPrompt: string;
  explanation: string;
  provider: "openai" | "anthropic";
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
  usage: {
    used: number;
    limit: number;
    remaining: number;
    month: string;
  };
};

function clampPrompt(prompt: string) {
  return prompt.trim().slice(0, 12000);
}

export function PromptShrinker() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"auto" | "openai" | "anthropic">("auto");
  const [result, setResult] = useState<ShrinkResult | null>(null);
  const [loading, setLoading] = useState(false);

  const promptLength = useMemo(() => prompt.trim().length, [prompt]);

  const runShrink = async () => {
    const normalized = clampPrompt(prompt);

    if (!normalized) {
      toast.error("Paste a prompt before running compression.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/shrink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: normalized,
          provider
        })
      });

      const data = (await response.json()) as ShrinkResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Prompt compression failed.");
      }

      setResult(data);
      toast.success(`Compressed with ${data.savingsPercent}% token savings.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prompt compression failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result?.compressedPrompt) {
      return;
    }
    await navigator.clipboard.writeText(result.compressedPrompt);
    toast.success("Compressed prompt copied to clipboard.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            Input Prompt
          </CardTitle>
          <CardDescription>
            Paste your full prompt. Prompt Shrinker removes filler and keeps intent + constraints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Paste a production prompt here"
            className="min-h-[280px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>{promptLength} characters</span>
            <div className="flex items-center gap-2">
              <label htmlFor="provider" className="text-slate-300">
                Provider
              </label>
              <select
                id="provider"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value={provider}
                onChange={(event) =>
                  setProvider(event.target.value as "auto" | "openai" | "anthropic")
                }
              >
                <option value="auto">Auto</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
          </div>
          <Button onClick={runShrink} disabled={loading} className="w-full" size="lg">
            {loading ? "Shrinking..." : "Shrink Prompt"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Compressed Prompt</CardTitle>
          <CardDescription>
            Built to keep quality while reducing token spend in Claude or GPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={result?.compressedPrompt || ""}
            readOnly
            placeholder="Your compressed prompt appears here"
            className="min-h-[280px]"
          />

          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-slate-400">Token Savings</p>
                  <p className="text-lg font-semibold text-cyan-300">{result.savingsPercent}%</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-slate-400">Before</p>
                  <p className="text-lg font-semibold">~{result.originalTokens}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-slate-400">After</p>
                  <p className="text-lg font-semibold">~{result.compressedTokens}</p>
                </div>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-200">What changed</p>
                <p className="mt-1">{result.explanation}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Provider: {result.provider} · Monthly usage: {result.usage.used}/{result.usage.limit}
                </p>
              </div>
              <Button variant="secondary" onClick={copyResult} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy Compressed Prompt
              </Button>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              Run compression to view prompt savings and copy a production-ready version.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
