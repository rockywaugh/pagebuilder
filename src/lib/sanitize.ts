const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPTISH =
  /<\s*(script|iframe|object|embed|link|meta|form|svg|math)[\s>]/i;
const HANDLER = /\bon[a-z]+\s*=/i;
const PROTOCOL = /(?:javascript|data|vbscript|file|blob)\s*:/i;

export function cleanText(input: string, max = 2_000): string {
  return input
    .replace(CONTROL, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function looksLikeCodeInjection(input: string): boolean {
  const value = input.toLowerCase();
  return (
    SCRIPTISH.test(value) ||
    HANDLER.test(value) ||
    PROTOCOL.test(value) ||
    value.includes("<?php") ||
    value.includes("<%") ||
    value.includes("${") && value.includes("}") ||
    value.includes("{{") && value.includes("}}")
  );
}

export function stripMarkup(input: string): string {
  return cleanText(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  const slug = stripMarkup(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "page";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function newId(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function escapeXml(input: string): string {
  return stripMarkup(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
