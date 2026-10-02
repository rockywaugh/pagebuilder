import { RESERVED_SITE_SLUGS } from "./config";
import { slugify } from "./sanitize";

const RESERVED = new Set<string>(RESERVED_SITE_SLUGS);

export function isReservedSiteSlug(slug: string): boolean {
  return RESERVED.has(slug);
}

export function isValidSiteSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 64 && !RESERVED.has(slug);
}

export function siteBaseSlug(name: string): string {
  let base = slugify(name);
  if (base.length < 3) base = `page-${base}`;
  if (RESERVED.has(base)) base = `site-${base}`;
  return base.slice(0, 48);
}

export function sitePath(slug: string): string {
  return `/${slug}`;
}

export function siteLoginPath(slug: string): string {
  return `/${slug}/login`;
}
