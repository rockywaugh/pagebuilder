export const APP_NAME = "PageBuilder";
export const DEFAULT_PAGE_NAME = "Your page name here";

export function isPlaceholderPageName(name: string | undefined) {
  return !name || name === "Untitled page" || name === DEFAULT_PAGE_NAME;
}

export const PRICES = {
  exportUsd: 29,
  membershipUsd: 19,
  hostedLoginUsd: 5,
  deployUsd: 10,
} as const;

/** Path segments that must never become a published site URL. */
export const RESERVED_SITE_SLUGS = [
  "account",
  "api",
  "assets",
  "catalog",
  "examples",
  "export",
  "favicon.ico",
  "live",
  "login",
  "preview",
  "pricing",
  "robots.txt",
  "signup",
  "sitemap.xml",
  "static",
  "studio",
  "www",
] as const;

export const LIMITS = {
  maxMessageChars: 2_000,
  maxMessagesPerProject: 80,
  maxUploadsPerProject: 12,
  maxExamplesPerQuery: 8,
  guestProjectLimit: 1,
  freePageLimit: 1,
  pageLimit: 4,
  guestTtlDays: 7,
  deploySlotsDefault: 1,
  deploySlotsPlan: 2,
  chatPerHour: 200,
  uploadsPerHour: 20,
  searchPerHour: 120,
} as const;

export const IMAGE_RULES = {
  allowedMime: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExt: [".jpg", ".jpeg", ".png", ".webp"] as const,
  maxBytes: 4 * 1024 * 1024,
  minBytes: 12 * 1024,
  minWidth: 640,
  minHeight: 400,
  maxWidth: 6000,
  maxHeight: 6000,
  minLaplacianVariance: 28,
  maxSkinRatio: 0.72,
  warnSkinRatio: 0.55,
  outputMaxWidth: 1600,
} as const;

export function isDemoPayments() {
  return !process.env.STRIPE_SECRET_KEY;
}

export function publicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
