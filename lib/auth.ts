import { createHmac, timingSafeEqual } from "crypto";

export type UserSession = {
  email: string;
  plan: "pro";
  exp: number;
};

export const ACCESS_COOKIE_NAME = "prompt_shrinker_session";

function getSecret() {
  return (
    process.env.ACCESS_COOKIE_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "replace-this-secret-in-production"
  );
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(email: string, maxAgeDays = 32) {
  const payload: UserSession = {
    email,
    plan: "pro",
    exp: Math.floor(Date.now() / 1000) + maxAgeDays * 24 * 60 * 60
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function parseSessionToken(token?: string | null): UserSession | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encoded, signature] = token.split(".", 2);
  const expectedSignature = sign(encoded);

  if (!signature) {
    return null;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UserSession;
    if (!payload.email || payload.plan !== "pro" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
