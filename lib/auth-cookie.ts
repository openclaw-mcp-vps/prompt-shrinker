import crypto from "node:crypto";

export const ACCESS_COOKIE_NAME = "prompt_shrinker_access";
const ACCESS_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

type AccessPayload = {
  email: string;
  exp: number;
};

function getSigningSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "local-dev-signing-secret";
}

function encodeBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

export function createAccessToken(email: string) {
  const payload: AccessPayload = {
    email: email.toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + ACCESS_COOKIE_TTL_SECONDS
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | undefined | null): AccessPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as AccessPayload;
    if (!parsed.email || !parsed.exp) {
      return null;
    }

    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getAccessCookieMaxAgeSeconds() {
  return ACCESS_COOKIE_TTL_SECONDS;
}
