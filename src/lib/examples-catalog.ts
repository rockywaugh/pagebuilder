import type { ExampleItem, HeaderStyle, SiteTheme } from "./types";
import { reviewSearchQuery } from "./content-policy";
import { stripMarkup } from "./sanitize";

export const EXAMPLES: ExampleItem[] = [
  {
    id: "bg-linen",
    kind: "background",
    title: "Warm linen",
    tags: ["background", "cream", "quiet", "bakery", "studio"],
    blurb: "A paper-like wash. Good for cafes, makers, and editorial pages.",
  },
  {
    id: "bg-ink",
    kind: "background",
    title: "Night ink",
    tags: ["background", "dark", "gallery", "architecture", "evening"],
    blurb: "Deep charcoal field for galleries and product launches.",
  },
  {
    id: "bg-moss",
    kind: "background",
    title: "Greenhouse",
    tags: ["background", "green", "garden", "wellness", "natural"],
    blurb: "Soft moss tone for wellness, florists, and outdoor brands.",
  },
  {
    id: "bg-clay",
    kind: "background",
    title: "Kiln clay",
    tags: ["background", "terracotta", "pottery", "restaurant", "warm"],
    blurb: "Fired-earth color for restaurants and craft shops.",
  },
  {
    id: "bg-slate",
    kind: "background",
    title: "Harbor slate",
    tags: ["background", "blue", "coastal", "consulting", "calm"],
    blurb: "Cool slate for coastal businesses and consultants.",
  },
  {
    id: "bg-sand",
    kind: "background",
    title: "Dune",
    tags: ["background", "sand", "travel", "hotel", "light"],
    blurb: "Sun-bleached sand for inns and travel pages.",
  },
  {
    id: "hdr-centered",
    kind: "header",
    title: "Centered masthead",
    tags: ["header", "classic", "restaurant", "wedding"],
    blurb: "Name in the middle, a short line underneath, one button.",
    headerStyle: "centered",
  },
  {
    id: "hdr-split",
    kind: "header",
    title: "Split banner",
    tags: ["header", "modern", "studio", "portfolio"],
    blurb: "Words on the left, a color field on the right.",
    headerStyle: "split",
  },
  {
    id: "hdr-editorial",
    kind: "header",
    title: "Editorial stack",
    tags: ["header", "magazine", "serif", "gallery"],
    blurb: "Large serif headline with a thin rule and a caption.",
    headerStyle: "editorial",
  },
  {
    id: "hdr-minimal",
    kind: "header",
    title: "Quiet bar",
    tags: ["header", "minimal", "saas", "clinic"],
    blurb: "Small wordmark, short sentence, no decoration.",
    headerStyle: "minimal",
  },
  {
    id: "pal-paper",
    kind: "palette",
    title: "Press paper",
    tags: ["palette", "cream", "ink", "editorial"],
    blurb: "Ivory ground, near-black type, clay accent.",
    swatches: ["#f3eadc", "#1c1712", "#c45c26", "#8a7d6d"],
  },
  {
    id: "pal-night",
    kind: "palette",
    title: "After hours",
    tags: ["palette", "dark", "gold", "gallery"],
    blurb: "Charcoal ground, bone type, muted gold.",
    swatches: ["#141210", "#efe6d6", "#c4a46a", "#6b6458"],
  },
  {
    id: "pal-grove",
    kind: "palette",
    title: "Grove",
    tags: ["palette", "green", "wellness", "natural"],
    blurb: "Sage ground, forest type, copper accent.",
    swatches: ["#e4eadc", "#243026", "#b5683a", "#6d7a64"],
  },
  {
    id: "pal-coast",
    kind: "palette",
    title: "Coast",
    tags: ["palette", "blue", "calm", "hotel"],
    blurb: "Mist ground, navy type, sea-glass accent.",
    swatches: ["#e7eef2", "#1c2a36", "#3f7a73", "#7d8b94"],
  },
];

const THEME_FROM_EXAMPLE: Record<string, Partial<SiteTheme>> = {
  "bg-linen": { bg: "#f3eadc", ink: "#1c1712", muted: "#8a7d6d" },
  "bg-ink": { bg: "#141210", ink: "#efe6d6", muted: "#6b6458" },
  "bg-moss": { bg: "#e4eadc", ink: "#243026", muted: "#6d7a64" },
  "bg-clay": { bg: "#f0ddd0", ink: "#2a1810", accent: "#c45c26", muted: "#8b6a58" },
  "bg-slate": { bg: "#e7eef2", ink: "#1c2a36", accent: "#3f7a73", muted: "#7d8b94" },
  "bg-sand": { bg: "#f4ead6", ink: "#2b2216", accent: "#b07a3a", muted: "#8b7b62" },
  "hdr-centered": { headerStyle: "centered" },
  "hdr-split": { headerStyle: "split" },
  "hdr-editorial": { headerStyle: "editorial", font: "serif" },
  "hdr-minimal": { headerStyle: "minimal", font: "sans" },
  "pal-paper": {
    bg: "#f3eadc",
    ink: "#1c1712",
    accent: "#c45c26",
    muted: "#8a7d6d",
    font: "serif",
  },
  "pal-night": {
    bg: "#141210",
    ink: "#efe6d6",
    accent: "#c4a46a",
    muted: "#6b6458",
    font: "serif",
  },
  "pal-grove": {
    bg: "#e4eadc",
    ink: "#243026",
    accent: "#b5683a",
    muted: "#6d7a64",
    font: "serif",
  },
  "pal-coast": {
    bg: "#e7eef2",
    ink: "#1c2a36",
    accent: "#3f7a73",
    muted: "#7d8b94",
    font: "sans",
  },
};

export function searchExamples(rawQuery: string): ExampleItem[] | { error: string } {
  const query = stripMarkup(rawQuery).toLowerCase();
  const policy = reviewSearchQuery(query);
  if (!policy.ok) return { error: policy.reason };

  const kind = /\bheader/.test(query)
    ? "header"
    : /\bpalette/.test(query)
      ? "palette"
      : /\bbackground/.test(query)
        ? "background"
        : undefined;
  if (kind) return EXAMPLES.filter((item) => item.kind === kind);

  const terms = query.split(/[^a-z0-9]+/).filter((term) => term.length > 1);
  const scored = EXAMPLES.map((item) => {
    const hay = `${item.title} ${item.blurb} ${item.tags.join(" ")} ${item.kind}`.toLowerCase();
    const score = terms.reduce((sum, term) => (hay.includes(term) ? sum + 1 : sum), 0);
    return { item, score };
  });

  const matches = scored
    .filter((row) => (terms.length === 0 ? true : row.score > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((row) => row.item);

  return matches.length ? matches : EXAMPLES.slice(0, 8);
}

export function findExample(text: string): ExampleItem | undefined {
  const hay = stripMarkup(text).toLowerCase().trim();
  if (!hay) return undefined;
  const byId = hay.match(/\b(bg|hdr|pal)-[a-z0-9-]+/);
  if (byId) return EXAMPLES.find((item) => item.id === byId[0]);
  return EXAMPLES.find(
    (item) => hay === item.title.toLowerCase() || hay.includes(item.title.toLowerCase()),
  );
}

export function applyExample(theme: SiteTheme, exampleId: string): SiteTheme {
  const patch = THEME_FROM_EXAMPLE[exampleId];
  if (!patch) return theme;
  return { ...theme, ...patch };
}

export function headerFromExample(exampleId: string): HeaderStyle | undefined {
  return EXAMPLES.find((item) => item.id === exampleId)?.headerStyle;
}
