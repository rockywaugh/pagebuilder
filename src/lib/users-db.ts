import { timingSafeEqual } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { newId } from "./sanitize";
import type { UserRecord } from "./types";

const ROOT = path.join(process.cwd(), "data");
const DB_PATH = path.join(ROOT, "accounts.sqlite");
const LEGACY_USERS = path.join(ROOT, "users.json");

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  membership: number;
  membership_until: string | null;
  hosted_login: number;
  hosted_login_until: string | null;
  deploy_plan: number;
  deploy_plan_until: string | null;
  stripe_customer_id: string | null;
};

type PendingRow = {
  email: string;
  password_hash: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  created_at: string;
};

let db: DatabaseSync | null = null;

function database() {
  if (db) return db;
  mkdirSync(ROOT, { recursive: true });
  const next = new DatabaseSync(DB_PATH);
  next.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      membership INTEGER NOT NULL DEFAULT 0,
      membership_until TEXT,
      hosted_login INTEGER NOT NULL DEFAULT 0,
      hosted_login_until TEXT,
      deploy_plan INTEGER NOT NULL DEFAULT 0,
      deploy_plan_until TEXT,
      stripe_customer_id TEXT
    );
    CREATE TABLE IF NOT EXISTS pending_signups (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  try {
    chmodSync(DB_PATH, 0o600);
  } catch {
    // The file mode is best-effort on platforms that ignore it.
  }
  importLegacyUsers(next);
  db = next;
  return next;
}

function importLegacyUsers(next: DatabaseSync) {
  let raw: string;
  try {
    raw = readFileSync(LEGACY_USERS, "utf8");
  } catch {
    return;
  }
  let users: UserRecord[];
  try {
    const parsed = JSON.parse(raw) as UserRecord[];
    if (!Array.isArray(parsed)) return;
    users = parsed;
  } catch {
    return;
  }
  const insert = next.prepare(`
    INSERT INTO users (
      id, email, password_hash, created_at, membership, membership_until,
      hosted_login, hosted_login_until, deploy_plan, deploy_plan_until, stripe_customer_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO NOTHING
  `);
  next.exec("BEGIN");
  try {
    for (const user of users) {
      if (!user?.id || !user.email || !user.passwordHash) continue;
      insert.run(
        user.id,
        user.email.toLowerCase(),
        user.passwordHash,
        user.createdAt || new Date().toISOString(),
        user.membership ? 1 : 0,
        user.membershipUntil,
        user.hostedLogin ? 1 : 0,
        user.hostedLoginUntil ?? null,
        user.deployPlan ? 1 : 0,
        user.deployPlanUntil ?? null,
        user.stripeCustomerId ?? null,
      );
    }
    next.exec("COMMIT");
  } catch (error) {
    next.exec("ROLLBACK");
    throw error;
  }
  renameSync(LEGACY_USERS, `${LEGACY_USERS}.imported`);
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    membership: row.membership === 1,
    membershipUntil: row.membership_until,
    hostedLogin: row.hosted_login === 1,
    hostedLoginUntil: row.hosted_login_until,
    deployPlan: row.deploy_plan === 1,
    deployPlanUntil: row.deploy_plan_until,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
  };
}

export function getUserByEmail(email: string): UserRecord | null {
  const row = database().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as
    | UserRow
    | undefined;
  return row ? toUser(row) : null;
}

export function getUserById(id: string): UserRecord | null {
  const row = database().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export function upsertUser(user: UserRecord) {
  database()
    .prepare(`
      INSERT INTO users (
        id, email, password_hash, created_at, membership, membership_until,
        hosted_login, hosted_login_until, deploy_plan, deploy_plan_until, stripe_customer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        created_at = excluded.created_at,
        membership = excluded.membership,
        membership_until = excluded.membership_until,
        hosted_login = excluded.hosted_login,
        hosted_login_until = excluded.hosted_login_until,
        deploy_plan = excluded.deploy_plan,
        deploy_plan_until = excluded.deploy_plan_until,
        stripe_customer_id = excluded.stripe_customer_id
    `)
    .run(
      user.id,
      user.email.toLowerCase(),
      user.passwordHash,
      user.createdAt,
      user.membership ? 1 : 0,
      user.membershipUntil,
      user.hostedLogin ? 1 : 0,
      user.hostedLoginUntil ?? null,
      user.deployPlan ? 1 : 0,
      user.deployPlanUntil ?? null,
      user.stripeCustomerId ?? null,
    );
}

export function savePendingSignup(input: {
  email: string;
  passwordHash: string;
  codeHash: string;
  expiresAt: string;
}) {
  const existing = database()
    .prepare("SELECT created_at FROM pending_signups WHERE email = ?")
    .get(input.email) as { created_at: string } | undefined;
  if (existing && Date.now() - new Date(existing.created_at).getTime() < 20_000) {
    return { ok: false as const, error: "Wait a moment before requesting another code." };
  }
  database()
    .prepare(`
      INSERT INTO pending_signups (email, password_hash, code_hash, expires_at, attempts, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        code_hash = excluded.code_hash,
        expires_at = excluded.expires_at,
        attempts = 0,
        created_at = excluded.created_at
    `)
    .run(input.email, input.passwordHash, input.codeHash, input.expiresAt, new Date().toISOString());
  return { ok: true as const };
}

export function confirmPendingSignup(email: string, codeHash: string): { ok: true } | { ok: false; error: string } {
  const next = database();
  next.exec("BEGIN IMMEDIATE");
  try {
    const row = next.prepare("SELECT * FROM pending_signups WHERE email = ?").get(email) as PendingRow | undefined;
    if (!row) {
      next.exec("ROLLBACK");
      return { ok: false, error: "That code is not valid. Start sign-up again." };
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      next.prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
      next.exec("COMMIT");
      return { ok: false, error: "That code has expired. Start sign-up again." };
    }
    if (row.attempts >= 5) {
      next.prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
      next.exec("COMMIT");
      return { ok: false, error: "Too many incorrect codes. Start sign-up again." };
    }
    const stored = Buffer.from(row.code_hash);
    const given = Buffer.from(codeHash);
    const match = stored.length === given.length && timingSafeEqual(stored, given);
    if (!match) {
      const attempts = row.attempts + 1;
      if (attempts >= 5) next.prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
      else next.prepare("UPDATE pending_signups SET attempts = ? WHERE email = ?").run(attempts, email);
      next.exec("COMMIT");
      return {
        ok: false,
        error: attempts >= 5 ? "Too many incorrect codes. Start sign-up again." : "That code is incorrect.",
      };
    }

    const now = new Date().toISOString();
    next
      .prepare(`
        INSERT INTO users (
          id, email, password_hash, created_at, membership, membership_until,
          hosted_login, hosted_login_until, deploy_plan, deploy_plan_until, stripe_customer_id
        ) VALUES (?, ?, ?, ?, 0, NULL, 0, NULL, 0, NULL, NULL)
      `)
      .run(newId("usr"), email, row.password_hash, now);
    next.prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
    next.exec("COMMIT");
    return { ok: true };
  } catch (error) {
    next.exec("ROLLBACK");
    throw error;
  }
}
