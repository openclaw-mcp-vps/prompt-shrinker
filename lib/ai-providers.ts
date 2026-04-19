import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type CompressionMode = "balanced" | "aggressive";

export type CompressionResult = {
  compressedPrompt: string;
  summary: string;
  riskNotes: string;
  provider: "openai" | "anthropic" | "local";
  model: string;
  inputTokens: number;
  outputTokens: number;
  reductionPercent: number;
};

const SYSTEM_PROMPT = `You are Prompt Shrinker, an expert prompt optimizer for production LLM systems.
Rewrite prompts so they use significantly fewer tokens while preserving intent, constraints, and output quality.
Never remove hard requirements, success criteria, safety boundaries, or formatting instructions.
Return strict JSON with keys: compressedPrompt, summary, riskNotes.`;

function estimateTokens(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  const approx = Math.ceil(normalized.length / 4);
  return Math.max(1, approx);
}

function reductionPercent(inputTokens: number, outputTokens: number) {
  if (inputTokens === 0) {
    return 0;
  }

  const reduction = ((inputTokens - outputTokens) / inputTokens) * 100;
  return Number(Math.max(0, Math.min(95, reduction)).toFixed(1));
}

function parseJsonResponse(rawText: string) {
  const direct = rawText.trim();

  const candidates = [direct];
  const fenceMatch = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    candidates.push(fenceMatch[1].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        compressedPrompt?: string;
        summary?: string;
        riskNotes?: string;
      };

      if (parsed.compressedPrompt && parsed.compressedPrompt.trim().length > 0) {
        return {
          compressedPrompt: parsed.compressedPrompt.trim(),
          summary: parsed.summary?.trim() || "Prompt compressed while preserving constraints.",
          riskNotes: parsed.riskNotes?.trim() || "Review for edge-case tone and verbosity expectations."
        };
      }
    } catch {
      // Keep trying fallbacks.
    }
  }

  throw new Error("Model returned non-JSON output");
}

function buildUserPrompt(prompt: string, mode: CompressionMode) {
  const target = mode === "aggressive" ? "50-70%" : "40-55%";

  return [
    `Compression mode: ${mode}.`,
    `Target reduction: ${target}.`,
    "Keep all must-have requirements and output format instructions.",
    "If needed, rewrite into concise bullet constraints plus execution steps.",
    "Original prompt:",
    prompt
  ].join("\n\n");
}

async function compressWithOpenAI(prompt: string, mode: CompressionMode): Promise<CompressionResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(prompt, mode) }
    ]
  });

  const rawText = completion.choices[0]?.message?.content;
  if (!rawText) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = parseJsonResponse(rawText);
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(parsed.compressedPrompt);

  return {
    ...parsed,
    provider: "openai",
    model,
    inputTokens,
    outputTokens,
    reductionPercent: reductionPercent(inputTokens, outputTokens)
  };
}

async function compressWithAnthropic(prompt: string, mode: CompressionMode): Promise<CompressionResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-latest";

  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(prompt, mode)
      }
    ]
  });

  const textBlock = response.content.find((item) => item.type === "text");
  const rawText = textBlock?.text;

  if (!rawText) {
    throw new Error("Anthropic returned an empty response");
  }

  const parsed = parseJsonResponse(rawText);
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(parsed.compressedPrompt);

  return {
    ...parsed,
    provider: "anthropic",
    model,
    inputTokens,
    outputTokens,
    reductionPercent: reductionPercent(inputTokens, outputTokens)
  };
}

function localCompression(prompt: string, mode: CompressionMode): CompressionResult {
  const lines = prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const normalized = lines.join(" ")
    .replace(/\bplease\b/gi, "")
    .replace(/\bkindly\b/gi, "")
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bat this point in time\b/gi, "now")
    .replace(/\s{2,}/g, " ")
    .trim();

  const sentenceParts = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const keepCount = mode === "aggressive" ? Math.max(2, Math.ceil(sentenceParts.length * 0.6)) : Math.max(3, Math.ceil(sentenceParts.length * 0.75));

  const compressedPrompt = sentenceParts.slice(0, keepCount).join(" ");
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(compressedPrompt);

  return {
    compressedPrompt: compressedPrompt || normalized,
    summary: "Used deterministic fallback compression because no API key was configured.",
    riskNotes: "Configure OPENAI_API_KEY or ANTHROPIC_API_KEY for best quality-preserving compression.",
    provider: "local",
    model: "local-fallback-v1",
    inputTokens,
    outputTokens,
    reductionPercent: reductionPercent(inputTokens, outputTokens)
  };
}

export async function compressPrompt(prompt: string, mode: CompressionMode): Promise<CompressionResult> {
  if (process.env.OPENAI_API_KEY) {
    return compressWithOpenAI(prompt, mode);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return compressWithAnthropic(prompt, mode);
  }

  return localCompression(prompt, mode);
}
