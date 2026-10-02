import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { LIMITS, publicAppUrl } from "./config";
import { unpublishProject } from "./published";
import { newId } from "./sanitize";
import { deleteProject, listAllProjects, saveProject } from "./store";
import type { Project } from "./types";

const ROOT = path.join(process.cwd(), "data");
const TOKENS = path.join(ROOT, "guest-tokens.json");
const OUTBOX = path.join(ROOT, "outbox");

export type GuestToken = {
  token: string;
  email: string;
  projectId: string;
  createdAt: string;
  expiresAt: string;
};

function guestTtlMs() {
  return LIMITS.guestTtlDays * 24 * 60 * 60 * 1000;
}

export function guestExpiry(from = new Date()) {
  return new Date(from.getTime() + guestTtlMs()).toISOString();
}

export function resumeUrlFor(token: string) {
  return `${publicAppUrl()}/studio?resume=${encodeURIComponent(token)}`;
}

async function readTokens(): Promise<GuestToken[]> {
  try {
    return JSON.parse(await readFile(TOKENS, "utf8")) as GuestToken[];
  } catch {
    return [];
  }
}

async function writeTokens(tokens: GuestToken[]) {
  await mkdir(ROOT, { recursive: true });
  await writeFile(TOKENS, JSON.stringify(tokens, null, 2));
}

export async function findGuestToken(token: string): Promise<GuestToken | null> {
  const tokens = await readTokens();
  return tokens.find((item) => item.token === token) ?? null;
}

export async function upsertGuestToken(project: Project, email: string): Promise<GuestToken> {
  const tokens = await readTokens();
  const now = new Date().toISOString();
  const expiresAt = guestExpiry();
  const existing = tokens.find((item) => item.projectId === project.id);
  const record: GuestToken = existing
    ? { ...existing, email, expiresAt }
    : {
        token: newId("tok"),
        email,
        projectId: project.id,
        createdAt: now,
        expiresAt,
      };
  const next = existing
    ? tokens.map((item) => (item.projectId === project.id ? record : item))
    : [...tokens, record];
  await writeTokens(next);
  project.guestEmail = email;
  project.resumeToken = record.token;
  project.expiresAt = expiresAt;
  return record;
}

export async function removeGuestTokensForProject(projectId: string) {
  const tokens = await readTokens();
  await writeTokens(tokens.filter((item) => item.projectId !== projectId));
}

export async function sendGuestPageEmail(opts: {
  email: string;
  token: string;
  pageName: string;
}) {
  const resumeUrl = resumeUrlFor(opts.token);
  const subject = `${opts.pageName} is ready on PageBuilder`;
  const text = [
    `Your page “${opts.pageName}” is ready.`,
    `Open it again with this link (kept for ${LIMITS.guestTtlDays} days):`,
    resumeUrl,
    "",
    "Create an account from that session if you want to keep the page and start a membership.",
  ].join("\n");

  await mkdir(OUTBOX, { recursive: true });
  await writeFile(
    path.join(OUTBOX, `${opts.token}.txt`),
    [`To: ${opts.email}`, `Subject: ${subject}`, "", text].join("\n"),
  );

  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "PageBuilder <noreply@localhost>";
  if (key) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.email],
        subject,
        text,
      }),
    }).catch(() => undefined);
  }

  return { resumeUrl, emailed: !!key };
}

export async function notifyGuestPageReady(project: Project) {
  if (project.ownerId || !project.guestEmail || !project.resumeToken) return null;
  return sendGuestPageEmail({
    email: project.guestEmail,
    token: project.resumeToken,
    pageName: project.spec.name || "Your page",
  });
}

export async function purgeExpiredGuests() {
  const now = Date.now();
  const tokens = await readTokens();
  const keep: GuestToken[] = [];
  const expiredIds = new Set<string>();

  for (const token of tokens) {
    if (new Date(token.expiresAt).getTime() <= now) expiredIds.add(token.projectId);
    else keep.push(token);
  }

  const projects = await listAllProjects();
  for (const project of projects) {
    if (project.ownerId) continue;
    const expired =
      expiredIds.has(project.id) ||
      (!!project.expiresAt && new Date(project.expiresAt).getTime() <= now);
    if (!expired) continue;
    expiredIds.add(project.id);
    await unpublishProject(project);
    if (project.publishedSlug) {
      project.publishedSlug = null;
      await saveProject(project);
    }
    await deleteProject(project.id);
  }

  await writeTokens(keep.filter((item) => !expiredIds.has(item.projectId)));
  return { removed: expiredIds.size };
}
