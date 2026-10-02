import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isValidSiteSlug, siteBaseSlug } from "./site-url";
import type { Project } from "./types";

const ROOT = path.join(process.cwd(), "data");
const PUBLISHED = path.join(ROOT, "published");
const SITES = path.join(ROOT, "sites.json");

type SiteIndex = Record<string, { projectId: string; updatedAt: string }>;

async function readSites(): Promise<SiteIndex> {
  try {
    return JSON.parse(await readFile(SITES, "utf8")) as SiteIndex;
  } catch {
    return {};
  }
}

async function writeSites(index: SiteIndex) {
  await mkdir(ROOT, { recursive: true });
  await writeFile(SITES, JSON.stringify(index, null, 2));
}

export function publishedFile(slug: string, kind: "index" | "login"): string {
  const name = kind === "login" ? `${slug}.login.html` : `${slug}.html`;
  return path.join(PUBLISHED, name);
}

function projectSlugId(project: Project) {
  return project.id.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase();
}

export async function allocateSiteSlug(project: Project): Promise<string> {
  if (project.publishedSlug && isValidSiteSlug(project.publishedSlug)) {
    return project.publishedSlug;
  }

  const suffix = projectSlugId(project);
  const base = siteBaseSlug(project.spec.name);
  const next = `${base}-${suffix}`.replace(/^-+|-+$/g, "").slice(0, 64);
  return isValidSiteSlug(next) ? next : `page-${suffix}`;
}

export async function unpublishProject(project: Project) {
  const slug = project.publishedSlug;
  if (!slug) return;
  try {
    await unlink(publishedFile(slug, "index"));
  } catch {
    // already gone
  }
  try {
    await unlink(publishedFile(slug, "login"));
  } catch {
    // already gone
  }
  const index = await readSites();
  if (index[slug]?.projectId === project.id) delete index[slug];
  await writeSites(index);
  project.publishedSlug = null;
}

export async function rememberSiteSlug(slug: string, projectId: string) {
  const index = await readSites();
  for (const [key, value] of Object.entries(index)) {
    if (value.projectId === projectId && key !== slug) delete index[key];
  }
  index[slug] = { projectId, updatedAt: new Date().toISOString() };
  await writeSites(index);
}

export async function writePublishedPage(slug: string, kind: "index" | "login", html: string) {
  await mkdir(PUBLISHED, { recursive: true });
  await writeFile(publishedFile(slug, kind), html);
}

export async function readPublishedPage(slug: string, kind: "index" | "login"): Promise<string | null> {
  if (!isValidSiteSlug(slug)) return null;
  try {
    return await readFile(publishedFile(slug, kind), "utf8");
  } catch {
    return null;
  }
}

export async function listPublishedSlugs(): Promise<string[]> {
  try {
    const files = await readdir(PUBLISHED);
    return files.filter((file) => file.endsWith(".html") && !file.endsWith(".login.html")).map((file) => file.replace(/\.html$/, ""));
  } catch {
    return [];
  }
}
