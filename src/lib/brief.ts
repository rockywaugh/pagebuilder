import { DEFAULT_PAGE_NAME } from "./config";
import { newId } from "./sanitize";
import {
  applyFont,
  applyMood,
  applyPattern,
  defaultFontForPattern,
  defaultMoodForPattern,
  MARKET_FONTS,
  MARKET_MOODS,
  matchPattern,
  patternById,
  type MarketFont,
  type MarketMood,
  type MarketPattern,
} from "./ui-source";
import type { HeaderStyle, SectionType, SiteSpec } from "./types";

export type BriefIntent = {
  pattern?: MarketPattern;
  patternScore: number;
  mood?: MarketMood;
  font?: MarketFont;
  headerStyle?: HeaderStyle;
  name?: string;
  audience?: string;
  sectionTypes?: SectionType[];
  headline?: string;
  subhead?: string;
  cta?: string;
  shorterHeadline?: boolean;
  draftCopy?: boolean;
  ruleWeight?: number;
};

const MOOD_ALIASES: Array<[string[], string]> = [
  [["warm and paper", "paper-like", "letterpress", "ivory", "warm paper"], "warm-paper"],
  [["dark gallery", "darker", "charcoal", "night", "black background"], "dark-gallery"],
  [["coastal", "coast", "ocean", "sea-glass", "mist"], "coastal"],
  [["greenhouse", "sage", "garden", "grove"], "greenhouse"],
  [["cool and precise", "precise", "software-clean", "near-white"], "cool-product"],
  [["quiet navy", "navy", "chambers"], "quiet-navy"],
  [["soft spa", "mint", "teal"], "soft-spa"],
  [["kiln and clay", "kiln", "terracotta"], "kiln"],
];

const FONT_ALIASES: Array<[string[], string]> = [
  [["helvetica neue", "helvetica"], "helvetica"],
  [["gill sans"], "gill-sans"],
  [["figtree"], "figtree"],
  [["inter"], "inter"],
  [["avenir"], "avenir"],
  [["newsreader"], "newsreader"],
  [["georgia"], "georgia"],
  [["palatino"], "palatino"],
  [["didot"], "didot"],
  [["serif", "editorial type", "bookish"], "newsreader"],
  [["sans-serif", "sans", "modern type", "clean sans"], "inter"],
  [["display type", "fashion type"], "didot"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesPhrase(hay: string, phrase: string) {
  if (phrase.includes(" ")) return hay.includes(phrase);
  return new RegExp(`\\b${escapeRegExp(phrase)}\\b`).test(hay);
}

function matchMood(text: string): MarketMood | undefined {
  const hay = text.toLowerCase();
  const named = MARKET_MOODS.find((mood) => hay.includes(mood.name.toLowerCase()));
  if (named) return named;
  if (/\b(dark|black)\b/.test(hay) && !named) {
    return MARKET_MOODS.find((mood) => mood.id === "dark-gallery");
  }
  if (/\b(light|lighter|brighter)\b/.test(hay)) {
    return MARKET_MOODS.find((mood) => mood.id === "warm-paper");
  }
  for (const [aliases, id] of MOOD_ALIASES) {
    if (aliases.some((alias) => includesPhrase(hay, alias))) {
      return MARKET_MOODS.find((mood) => mood.id === id);
    }
  }
  return undefined;
}

function matchFont(text: string): MarketFont | undefined {
  const hay = text.toLowerCase();
  const named = [...MARKET_FONTS].sort((a, b) => b.name.length - a.name.length).find((font) => {
    return hay.includes(font.name.toLowerCase());
  });
  if (named) return named;
  for (const [aliases, id] of FONT_ALIASES) {
    if (aliases.some((alias) => includesPhrase(hay, alias))) {
      return MARKET_FONTS.find((font) => font.id === id);
    }
  }
  return undefined;
}

function matchRuleWeight(text: string): number | undefined {
  const hay = text.toLowerCase();
  const talksRules =
    /\b(rules?|dividers?|hairlines?)\b/.test(hay) ||
    /\blines?\s+above\s+(?:the\s+)?headers?\b/.test(hay);
  if (!talksRules) return undefined;
  if (/\b(hairline|thinner|thin|finest)\b/.test(hay)) return 1;
  if (/\b(much thicker|heavy|heavier|thickest|boldest)\b/.test(hay)) return 6;
  if (/\b(thicker|thicken|bolder|larger|bigger|increase)\b/.test(hay)) return 4;
  return undefined;
}

function matchHeader(text: string): HeaderStyle | undefined {
  const hay = text.toLowerCase();
  if (/\bcentered\b/.test(hay)) return "centered";
  if (/\bsplit\b/.test(hay)) return "split";
  if (/\beditorial\b/.test(hay)) return "editorial";
  if (/\b(minimal|quiet bar)\b/.test(hay)) return "minimal";
  return undefined;
}

function matchName(text: string): string | undefined {
  if (/^keep it unnamed/i.test(text)) return DEFAULT_PAGE_NAME;
  const called = text.match(/\b(?:called|named|name it|name is)\s+["“]?([^"”\n,.]{2,48})/i);
  if (called?.[1]) return called[1].trim();
  const quoted = text.match(/["“]([^"”]{2,48})["”]/);
  if (quoted?.[1]) return quoted[1].trim();
  return undefined;
}

function matchAudience(text: string): string | undefined {
  const match = text.match(/\bfor\s+(?!now\b)([^.\n]{3,80})/i);
  return match?.[1]?.trim();
}

export function parseSectionTypes(text: string): SectionType[] {
  const hay = text.toLowerCase();
  const wanted = new Set<SectionType>();
  if (/\b(story|about)\b/.test(hay)) wanted.add("story");
  if (/\b(offer|offering|menu|services?|features?)\b/.test(hay)) wanted.add("features");
  if (/\b(galler|photos?)\b/.test(hay)) wanted.add("gallery");
  if (/\b(quote|review|testimonial)\b/.test(hay)) wanted.add("quote");
  if (/\b(visit|hours|contact|location)\b/.test(hay)) wanted.add("visit");
  return [...wanted];
}

function matchHeadline(text: string): string | undefined {
  const labeled = text.match(/headline:\s*([^\n.]+)/i);
  if (labeled?.[1]) return labeled[1].trim();
  const spoken = text.match(/\bheadline\s+(?:should be|is|to)\s+["“]?([^"”\n.]{2,80})/i);
  return spoken?.[1]?.trim();
}

function matchCta(text: string): string | undefined {
  const labeled = text.match(/button:\s*([^\n.]+)/i);
  if (labeled?.[1]) return labeled[1].trim();
  const spoken = text.match(/\b(?:button|cta)\s+(?:should say|says|is)\s+["“]?([^"”\n.]{2,28})/i);
  return spoken?.[1]?.trim();
}

export function interpretBrief(text: string): BriefIntent {
  const match = matchPattern(text);
  return {
    pattern: match.score >= 1 ? match.pattern : undefined,
    patternScore: match.score,
    mood: matchMood(text),
    font: matchFont(text),
    headerStyle: matchHeader(text),
    name: matchName(text),
    audience: matchAudience(text),
    sectionTypes: parseSectionTypes(text),
    headline: matchHeadline(text),
    cta: matchCta(text),
    shorterHeadline: /\b(shorter|shorten)\b/.test(text.toLowerCase()),
    draftCopy: /write a draft/i.test(text),
    ruleWeight: matchRuleWeight(text),
  };
}

export function briefHasLook(intent: BriefIntent): boolean {
  return Boolean(
    intent.pattern ||
      intent.mood ||
      intent.font ||
      intent.headerStyle ||
      intent.sectionTypes?.length ||
      intent.headline ||
      intent.cta ||
      intent.shorterHeadline ||
      intent.draftCopy ||
      intent.ruleWeight != null,
  );
}

export function briefApplied(intent: BriefIntent): boolean {
  return briefHasLook(intent) || Boolean(intent.name || intent.audience || intent.subhead);
}

export function describeBrief(intent: BriefIntent): string {
  const bits: string[] = [];
  if (intent.pattern) bits.push(intent.pattern.name);
  if (intent.mood) bits.push(intent.mood.name);
  if (intent.font) bits.push(intent.font.name);
  if (intent.headerStyle) bits.push(intent.headerStyle);
  if (intent.name && intent.name !== DEFAULT_PAGE_NAME) bits.push(`“${intent.name}”`);
  if (intent.sectionTypes?.length) bits.push(intent.sectionTypes.join(", "));
  if (intent.shorterHeadline) bits.push("shorter headline");
  if (intent.ruleWeight === 1) bits.push("hairline rules");
  if (intent.ruleWeight != null && intent.ruleWeight > 1) bits.push("thicker rules");
  return bits.join(" · ");
}

export function applyBrief(spec: SiteSpec, intent: BriefIntent): SiteSpec {
  let next: SiteSpec = {
    ...spec,
    theme: { ...spec.theme },
    hero: { ...spec.hero },
    sections: spec.sections.map((section) => ({ ...section })),
  };

  if (intent.pattern) {
    const keptName = next.name;
    next = applyPattern(next, intent.pattern);
    if (keptName) next.name = keptName;
    if (!intent.mood) next = applyMood(next, defaultMoodForPattern(intent.pattern));
    if (!intent.font) next = applyFont(next, defaultFontForPattern(intent.pattern));
    next.hero.headline = intent.pattern.headline(next.name);
  }
  if (intent.mood) next = applyMood(next, intent.mood);
  if (intent.font) next = applyFont(next, intent.font);
  if (intent.headerStyle) {
    next.theme = { ...next.theme, headerStyle: intent.headerStyle };
  }
  if (intent.ruleWeight != null) {
    next.theme = { ...next.theme, ruleWeight: intent.ruleWeight };
  }
  if (intent.name) {
    next.name = intent.name.slice(0, 48);
    const pattern = patternById(next.patternId);
    if (!intent.headline) {
      next.hero.headline = pattern ? pattern.headline(next.name) : next.name;
    }
    next.footer = next.name;
  }
  if (intent.audience) {
    next.audience = intent.audience.slice(0, 160);
    if (!intent.subhead) next.hero.subhead = `For ${intent.audience.slice(0, 90)}.`;
  }
  if (intent.sectionTypes?.length) {
    const pattern = patternById(next.patternId) || intent.pattern;
    if (pattern) {
      const source = pattern.sections.filter((section) => intent.sectionTypes?.includes(section.type));
      const rows = source.length ? source : pattern.sections;
      next.sections = rows.map((section, index) => ({
        id: next.sections[index]?.id || newId("sec"),
        type: section.type,
        title: section.title,
        body: section.body,
        imageId: next.sections[index]?.imageId || spec.backgroundAssetId,
      }));
    }
  }
  if (intent.headline) next.hero.headline = intent.headline.slice(0, 80);
  if (intent.subhead) {
    next.hero.subhead = intent.subhead.slice(0, 180);
    if (next.sections[0] && !intent.sectionTypes?.length) {
      next.sections = [{ ...next.sections[0], body: intent.subhead.slice(0, 280) }, ...next.sections.slice(1)];
    }
  }
  if (intent.cta) next.hero.cta = intent.cta.slice(0, 28);
  if (intent.shorterHeadline) {
    next.hero.headline = next.hero.headline.split(" ").slice(0, 5).join(" ");
  }
  if (intent.draftCopy) {
    const pattern = patternById(next.patternId);
    if (pattern) {
      next.hero.headline = pattern.headline(next.name);
      next.hero.cta = pattern.cta;
      next.sections = pattern.sections.map((section, index) => ({
        id: next.sections[index]?.id || newId("sec"),
        type: section.type,
        title: section.title,
        body: section.body,
        imageId: next.sections[index]?.imageId || spec.backgroundAssetId,
      }));
    }
  }
  return next;
}

export function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function intentForStep(step: string, text: string): BriefIntent {
  const intent = interpretBrief(text);
  if (step === "name" && !intent.name && !briefHasLook(intent)) {
    intent.name = /^keep it unnamed/i.test(text) ? DEFAULT_PAGE_NAME : titleCase(text).slice(0, 48);
  }
  if (step === "audience" && !intent.audience && !briefHasLook(intent)) {
    intent.audience = text.slice(0, 160);
  }
  if (step === "copy" && !briefHasLook(intent) && !intent.headline && !intent.cta && !intent.draftCopy) {
    intent.subhead = text.slice(0, 180);
  }
  if (step === "sections" && !intent.sectionTypes?.length) {
    intent.sectionTypes = parseSectionTypes(text);
  }
  return intent;
}
