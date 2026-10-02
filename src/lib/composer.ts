import { applyBrief, briefApplied, describeBrief, intentForStep } from "./brief";
import { DEFAULT_PAGE_NAME } from "./config";
import { applyExample, EXAMPLES, headerFromExample, searchExamples } from "./examples-catalog";
import { nextStep, STEP_COPY } from "./guide";
import { stripMarkup } from "./sanitize";
import {
  applyFont,
  applyMood,
  applyPattern,
  applyPatternPalette,
  fontById,
  MARKET_FONTS,
  MARKET_MOODS,
  matchPattern,
  patternById,
} from "./ui-source";
import type {
  ExampleItem,
  FontMood,
  GuideStep,
  HeaderStyle,
  SiteSpec,
  SiteTheme,
} from "./types";

export function blankSpec(): SiteSpec {
  return {
    name: DEFAULT_PAGE_NAME,
    purpose: "",
    audience: "",
    hero: {
      headline: "A page, still on the press",
      subhead: "Answer the prompts on the left. The preview prints here — as an image, not a webpage.",
      cta: "Begin",
    },
    theme: {
      mood: "paper",
      bg: "#f3eadc",
      ink: "#1c1712",
      accent: "#c45c26",
      muted: "#8a7d6d",
      font: "serif",
      headerStyle: "editorial",
      ruleWeight: 1,
    },
    sections: [
      {
        id: "story",
        type: "story",
        title: "The work so far",
        body: "Each answer on the left resets the plate. Nothing here is inspectable HTML.",
      },
    ],
    footer: "Printed by PageBuilder",
  };
}

export type TurnResult = {
  spec: SiteSpec;
  step: GuideStep;
  assistant: string;
  suggestions: string[];
  examples?: ExampleItem[];
  exampleId?: string;
  confident?: boolean;
};

function wantsExamples(text: string): boolean {
  return /\b(examples?|browse|show me|ideas|backgrounds?|header styles?|palettes?)\b/.test(text.toLowerCase());
}

function pickExampleId(text: string): string | null {
  const hay = text.toLowerCase().trim();
  const byId = hay.match(/\b(bg|hdr|pal)-[a-z0-9-]+/);
  if (byId) return byId[0];
  return (
    EXAMPLES.find((item) => hay === item.title.toLowerCase() || hay.includes(item.title.toLowerCase()))?.id ??
    null
  );
}

export function applyUserTurn(
  spec: SiteSpec,
  step: GuideStep,
  raw: string,
  options?: { advance?: boolean; fromHint?: boolean; skip?: boolean },
): TurnResult {
  const text = stripMarkup(raw);
  if (options?.skip || /^skip$/i.test(text)) {
    if (step === "copy") {
      const drafted = applyBrief(spec, {
        patternScore: 0,
        draftCopy: true,
      });
      const next = options?.advance === false ? step : nextStep(step);
      return {
        spec: drafted,
        step: next,
        assistant: "Drafted from what you already told me.",
        suggestions: STEP_COPY[next].hints,
        confident: true,
      };
    }
    if (step === "refine") {
      const next = options?.advance === false ? step : nextStep(step);
      return {
        spec,
        step: next,
        assistant: next === "access" ? STEP_COPY.access.prompt : STEP_COPY.refine.prompt,
        suggestions: STEP_COPY[next].hints,
        confident: true,
      };
    }
    if (step === "access") {
      return {
        spec: { ...spec, showLogin: false },
        step: options?.advance === false ? step : "complete",
        assistant: STEP_COPY.complete.prompt,
        suggestions: [],
        confident: true,
      };
    }
  }
  const exampleId = pickExampleId(text);
  if (exampleId) {
    const header = headerFromExample(exampleId);
    const theme = applyExample(spec.theme, exampleId);
    const next: SiteSpec = {
      ...spec,
      theme: header ? { ...theme, headerStyle: header } : theme,
    };
    return {
      spec: next,
      step: options?.advance === false ? step : step === "imagery" ? nextStep(step) : step,
      assistant: `Using ${exampleId.replace("-", " ")}. The plate is reprinting on the right.`,
      suggestions: STEP_COPY[options?.advance === false || step !== "imagery" ? step : nextStep(step)].hints,
      exampleId,
      confident: true,
    };
  }

  if (wantsExamples(text)) {
    const found = searchExamples(text);
    const examples = Array.isArray(found) ? found : [];
    return {
      spec,
      step,
      assistant: Array.isArray(found)
        ? "Here are vetted examples from our library — not a raw web scrape. Choose one by name, or keep talking."
        : found.error,
      suggestions: STEP_COPY[step].hints,
      examples,
      confident: true,
    };
  }

  let nextSpec = { ...spec, theme: { ...spec.theme }, hero: { ...spec.hero } };
  let next: GuideStep = nextStep(step);
  let assistant = "";

  switch (step) {
    case "purpose": {
      const match = matchPattern(text);
      nextSpec = applyPattern(nextSpec, match.pattern);
      if (match.score < 1) {
        assistant = `PageBuilder only composes from professional site systems in the library. Closest match: ${match.pattern.name} (${match.pattern.market}). Confirm that name, or pick another from the suggestions.`;
        next = "purpose";
      } else {
        assistant = `Using ${match.pattern.name} — ${match.pattern.market}. ${match.pattern.look}`;
        next = "purpose";
      }
      return {
        spec: nextSpec,
        step: "purpose",
        assistant,
        suggestions:
          match.score < 1
            ? [match.pattern.name, ...match.alternates.map((item) => item.name)]
            : STEP_COPY.purpose.hints,
        confident: true,
      };
    }
    case "name":
    case "audience":
    case "sections":
    case "imagery":
    case "copy":
    case "refine": {
      const intent = intentForStep(step, text);
      if (briefApplied(intent) || step !== "refine") {
        nextSpec = applyBrief(nextSpec, intent);
        const summary = describeBrief(intent);
        if (step === "name" && intent.name && !summary.replace(`“${intent.name}”`, "").trim()) {
          assistant = `“${nextSpec.name}” is on the masthead. Who is this for?`;
        } else if (step === "audience" && intent.audience && !describeBrief({ ...intent, audience: undefined })) {
          assistant = "Who it is for is set. How should the page feel?";
        } else if (step === "imagery" && !briefApplied(intent)) {
          assistant = "Imagery notes are in. Any words you want written on the page?";
        } else if (summary) {
          assistant = `${summary} is on the plate.`;
        } else {
          assistant = "The plate is reprinting from that note.";
        }
      } else {
        assistant =
          "Describe a look from the library — darker, coastal, a serif, add a visit section — or unlock the files.";
      }
      if (step === "refine") next = options?.advance === false ? "refine" : "access";
      break;
    }
    case "font": {
      const font = MARKET_FONTS.find(
        (item) =>
          item.name.toLowerCase() === text.toLowerCase() ||
          text.toLowerCase().includes(item.name.toLowerCase()),
      );
      if (font) {
        nextSpec = applyFont(nextSpec, font);
        assistant = `${font.name} is on the page.`;
      } else {
        assistant = "Choose a typeface from the library — Inter, Helvetica Neue, Newsreader, Palatino…";
      }
      next = "font";
      break;
    }
    case "mood": {
      const mood = MARKET_MOODS.find(
        (item) => item.name.toLowerCase() === text.toLowerCase() || text.toLowerCase().includes(item.name.toLowerCase()),
      );
      if (mood) {
        nextSpec = applyMood(nextSpec, mood);
        assistant = `${mood.name} is on the page.`;
        next = "mood";
        break;
      }
      const match = matchPattern(text);
      nextSpec = applyPatternPalette(nextSpec, match.pattern);
      if (match.pattern.id && nextSpec.patternId && match.score >= 1) {
        nextSpec.patternId = match.pattern.id;
      }
      assistant =
        match.score < 1
          ? `That mood is not in the library. Applied the closest system: ${match.pattern.name}.`
          : `Mood from ${match.pattern.name}.`;
      next = "mood";
      break;
    }
    case "access":
    case "complete":
      next = step;
      assistant = STEP_COPY[step].prompt;
      break;
    default:
      assistant = STEP_COPY[next].prompt;
  }

  if (options?.advance === false) {
    next = step;
  }

  return {
    spec: nextSpec,
    step: next,
    assistant: assistant || STEP_COPY[next].prompt,
    suggestions: STEP_COPY[next === step ? step : next].hints,
    confident: true,
  };
}

export function applyAiPatch(
  spec: SiteSpec,
  patch: Partial<SiteSpec> & { theme?: Partial<SiteTheme>; patternId?: string },
): SiteSpec {
  const merged: SiteSpec = {
    ...spec,
    ...patch,
    hero: { ...spec.hero, ...patch.hero },
    theme: { ...spec.theme, ...patch.theme },
    sections: patch.sections ?? spec.sections,
  };
  const pattern = patternById(patch.patternId || merged.patternId);
  return pattern ? applyPattern(merged, pattern) : merged;
}

export function fontStack(spec: Pick<SiteSpec, "theme" | "fontId"> | FontMood): string {
  if (typeof spec !== "string") {
    const named = fontById(spec.fontId);
    if (named) return named.stack;
    spec = spec.theme.font;
  }
  if (spec === "sans") return "Figtree, Helvetica Neue, Helvetica, sans-serif";
  if (spec === "display") return "Didot, Fraunces, Georgia, serif";
  return "Newsreader, Georgia, serif";
}

export function headerLabel(style: HeaderStyle): string {
  return {
    centered: "Centered masthead",
    split: "Split banner",
    editorial: "Editorial stack",
    minimal: "Quiet bar",
  }[style];
}
