import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due" | "on_trial";

type UserRecord = {
  email: string;
  status: SubscriptionStatus;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
  updatedAt: string;
};

type UsageRecord = {
  count: number;
  updatedAt: string;
};

type CheckoutIntent = {
  email: string;
  createdAt: string;
};

type DatabaseState = {
  users: Record<string, UserRecord>;
  usageByMonth: Record<string, UsageRecord>;
  checkoutIntents: Record<string, CheckoutIntent>;
};

const DB_FILE = path.join(process.cwd(), "data", "db.json");
export const MONTHLY_COMPRESSION_LIMIT = 300;

const EMPTY_DB: DatabaseState = {
  users: {},
  usageByMonth: {},
  checkoutIntents: {}
};

let writeQueue: Promise<unknown> = Promise.resolve();

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function usageKey(email: string, month: string) {
  return `${normalizeEmail(email)}:${month}`;
}

function nowIso() {
  return new Date().toISOString();
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function ensureDbFile() {
  await mkdir(path.dirname(DB_FILE), { recursive: true });

  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseState> {
  await ensureDbFile();

  try {
    const contents = await readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(contents) as Partial<DatabaseState>;
    return {
      users: parsed.users || {},
      usageByMonth: parsed.usageByMonth || {},
      checkoutIntents: parsed.checkoutIntents || {}
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(next: DatabaseState) {
  await ensureDbFile();
  await writeFile(DB_FILE, JSON.stringify(next, null, 2), "utf8");
}

async function withWriteLock<T>(writer: (db: DatabaseState) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const db = await readDb();
    const result = await writer(db);
    await writeDb(db);
    return result;
  };

  const pending = writeQueue.then(run, run);
  writeQueue = pending.then(
    () => undefined,
    () => undefined
  );

  return pending;
}

export async function saveCheckoutIntent(email: string) {
  const cleanEmail = normalizeEmail(email);

  await withWriteLock(async (db) => {
    db.checkoutIntents[cleanEmail] = {
      email: cleanEmail,
      createdAt: nowIso()
    };
  });
}

export async function getUser(email: string) {
  const db = await readDb();
  return db.users[normalizeEmail(email)] || null;
}

export async function hasActiveSubscription(email: string) {
  const user = await getUser(email);
  if (!user) {
    return false;
  }

  return user.status === "active" || user.status === "on_trial";
}

export async function setSubscriptionStatus(input: {
  email: string;
  status: SubscriptionStatus;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string;
}) {
  const cleanEmail = normalizeEmail(input.email);

  await withWriteLock(async (db) => {
    db.users[cleanEmail] = {
      email: cleanEmail,
      status: input.status,
      customerId: input.customerId || db.users[cleanEmail]?.customerId,
      subscriptionId: input.subscriptionId || db.users[cleanEmail]?.subscriptionId,
      currentPeriodEnd: input.currentPeriodEnd || db.users[cleanEmail]?.currentPeriodEnd,
      updatedAt: nowIso()
    };
  });
}

export async function getUsageSnapshot(email: string, limit = MONTHLY_COMPRESSION_LIMIT) {
  const db = await readDb();
  const month = currentMonthKey();
  const key = usageKey(email, month);
  const used = db.usageByMonth[key]?.count || 0;

  return {
    month,
    limit,
    used,
    remaining: Math.max(0, limit - used)
  };
}

export async function incrementUsage(email: string, limit = MONTHLY_COMPRESSION_LIMIT) {
  return withWriteLock(async (db) => {
    const month = currentMonthKey();
    const key = usageKey(email, month);
    const current = db.usageByMonth[key]?.count || 0;

    if (current >= limit) {
      return {
        month,
        limit,
        used: current,
        remaining: 0,
        allowed: false
      };
    }

    const nextCount = current + 1;
    db.usageByMonth[key] = {
      count: nextCount,
      updatedAt: nowIso()
    };

    return {
      month,
      limit,
      used: nextCount,
      remaining: Math.max(0, limit - nextCount),
      allowed: true
    };
  });
}
