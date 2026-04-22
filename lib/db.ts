import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Pool } from "pg";

type EntitlementRecord = {
  email: string;
  active: boolean;
  source: string;
  updatedAt: string;
};

type UsageRecord = {
  email: string;
  month: string;
  count: number;
  updatedAt: string;
};

type LocalStore = {
  entitlements: EntitlementRecord[];
  usage: UsageRecord[];
};

const DEFAULT_LIMIT = Number(process.env.MONTHLY_SHRINK_LIMIT ?? 500);
const monthKey = () => new Date().toISOString().slice(0, 7);

const usePg = Boolean(process.env.DATABASE_URL);
const pool = usePg ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
let schemaReadyPromise: Promise<void> | null = null;

const STORE_PATH = path.join(process.cwd(), ".data", "prompt-shrinker.json");

async function ensurePgSchema() {
  if (!pool) {
    return;
  }

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS prompt_shrinker_entitlements (
          email TEXT PRIMARY KEY,
          active BOOLEAN NOT NULL DEFAULT FALSE,
          source TEXT NOT NULL DEFAULT 'manual',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS prompt_shrinker_usage (
          email TEXT NOT NULL,
          month TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (email, month)
        )
      `);
    })();
  }

  await schemaReadyPromise;
}

async function readStore(): Promise<LocalStore> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStore;
    return {
      entitlements: parsed.entitlements ?? [],
      usage: parsed.usage ?? []
    };
  } catch {
    return { entitlements: [], usage: [] };
  }
}

async function writeStore(store: LocalStore) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export type UsageStats = {
  month: string;
  used: number;
  limit: number;
  remaining: number;
};

function toUsageStats(used: number): UsageStats {
  const limit = DEFAULT_LIMIT;
  return {
    month: monthKey(),
    used,
    limit,
    remaining: Math.max(limit - used, 0)
  };
}

export async function upsertEntitlement(email: string, active: boolean, source: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return;
  }

  if (pool) {
    await ensurePgSchema();
    await pool.query(
      `
      INSERT INTO prompt_shrinker_entitlements (email, active, source)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET active = EXCLUDED.active, source = EXCLUDED.source, updated_at = NOW()
      `,
      [cleanEmail, active, source]
    );
    return;
  }

  const store = await readStore();
  const now = new Date().toISOString();
  const existing = store.entitlements.find((entry) => entry.email === cleanEmail);

  if (existing) {
    existing.active = active;
    existing.source = source;
    existing.updatedAt = now;
  } else {
    store.entitlements.push({
      email: cleanEmail,
      active,
      source,
      updatedAt: now
    });
  }

  await writeStore(store);
}

export async function hasActiveEntitlement(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return false;
  }

  if (pool) {
    await ensurePgSchema();
    const result = await pool.query<{
      active: boolean;
    }>(
      `SELECT active FROM prompt_shrinker_entitlements WHERE email = $1`,
      [cleanEmail]
    );

    return result.rows[0]?.active ?? false;
  }

  const store = await readStore();
  return store.entitlements.find((entry) => entry.email === cleanEmail)?.active ?? false;
}

export async function getUsageStats(email: string): Promise<UsageStats> {
  const cleanEmail = email.trim().toLowerCase();
  const month = monthKey();

  if (pool) {
    await ensurePgSchema();
    const result = await pool.query<{ count: number }>(
      `
      SELECT count
      FROM prompt_shrinker_usage
      WHERE email = $1 AND month = $2
      `,
      [cleanEmail, month]
    );

    return toUsageStats(result.rows[0]?.count ?? 0);
  }

  const store = await readStore();
  const used = store.usage.find((entry) => entry.email === cleanEmail && entry.month === month)?.count ?? 0;
  return toUsageStats(used);
}

export async function incrementUsage(email: string): Promise<UsageStats> {
  const cleanEmail = email.trim().toLowerCase();
  const month = monthKey();

  if (pool) {
    await ensurePgSchema();

    await pool.query(
      `
      INSERT INTO prompt_shrinker_usage (email, month, count)
      VALUES ($1, $2, 0)
      ON CONFLICT (email, month) DO NOTHING
      `,
      [cleanEmail, month]
    );

    const result = await pool.query<{ count: number }>(
      `
      UPDATE prompt_shrinker_usage
      SET count = count + 1, updated_at = NOW()
      WHERE email = $1 AND month = $2
      RETURNING count
      `,
      [cleanEmail, month]
    );

    return toUsageStats(result.rows[0]?.count ?? 1);
  }

  const store = await readStore();
  const now = new Date().toISOString();
  let row = store.usage.find((entry) => entry.email === cleanEmail && entry.month === month);

  if (!row) {
    row = {
      email: cleanEmail,
      month,
      count: 0,
      updatedAt: now
    };
    store.usage.push(row);
  }

  row.count += 1;
  row.updatedAt = now;
  await writeStore(store);

  return toUsageStats(row.count);
}
