import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AiProvider = "openai" | "anthropic";

export type ShrinkResponse = {
  provider: AiProvider;
  compressedPrompt: string;
  explanation: string;
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
};

const COMPRESSION_SYSTEM_PROMPT = `You are Prompt Shrinker, an expert in prompt compression.
Rewrite the user's prompt so it uses 40-70% fewer tokens while preserving:
1) objective and scope
2) required constraints
3) output format requirements
4) key context needed for quality

Rules:
- Remove repetition, hedging, and filler.
- Keep critical details and acceptance criteria.
- Use compact, direct language.
- If the prompt includes examples, keep only the minimum needed.
- Never weaken safety constraints.

Return JSON only with keys:
compressed_prompt: string
explanation: short string describing what was preserved and what was removed.`;

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function parseModelJson(rawText: string) {
  try {
    return JSON.parse(rawText) as {
      compressed_prompt?: string;
      explanation?: string;
    };
  } catch {
    const candidate = rawText.match(/\{[\s\S]*\}/)?.[0];
    if (!candidate) {
      return {
        compressed_prompt: rawText.trim(),
        explanation: "Model returned plain text; used the response directly."
      };
    }

    try {
      return JSON.parse(candidate) as {
        compressed_prompt?: string;
        explanation?: string;
      };
    } catch {
      return {
        compressed_prompt: rawText.trim(),
        explanation: "Model returned invalid JSON; used the response directly."
      };
    }
  }
}

function pickProvider(requested?: string): AiProvider {
  if (requested === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (requested === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  throw new Error(
    "No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment."
  );
}

async function callOpenAI(prompt: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: COMPRESSION_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_output_tokens: 1200
  });

  return response.output_text?.trim() || "";
}

async function callAnthropic(prompt: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    max_tokens: 1200,
    temperature: 0.2,
    system: COMPRESSION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return message.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export async function shrinkPrompt(prompt: string, requestedProvider?: string): Promise<ShrinkResponse> {
  const provider = pickProvider(requestedProvider);
  const raw =
    provider === "anthropic" ? await callAnthropic(prompt) : await callOpenAI(prompt);

  const parsed = parseModelJson(raw);
  const compressedPrompt = (parsed.compressed_prompt || raw).trim();
  const explanation =
    parsed.explanation?.trim() ||
    "Removed filler and redundancy while preserving objective, constraints, and output structure.";

  if (!compressedPrompt) {
    throw new Error("Compression failed. Try again with a shorter input prompt.");
  }

  const originalTokens = estimateTokens(prompt);
  const compressedTokens = estimateTokens(compressedPrompt);
  const savingsPercent = Math.max(
    0,
    Math.min(100, Math.round(((originalTokens - compressedTokens) / originalTokens) * 100))
  );

  return {
    provider,
    compressedPrompt,
    explanation,
    originalTokens,
    compressedTokens,
    savingsPercent
  };
}
