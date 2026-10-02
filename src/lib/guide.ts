import type { GuideStep } from "./types";

export const STEPS: GuideStep[] = [
  "purpose",
  "mood",
  "font",
  "name",
  "audience",
  "sections",
  "imagery",
  "copy",
  "refine",
  "access",
];

export const ALL_STEPS: GuideStep[] = [...STEPS, "complete"];

export const STEP_COPY: Record<
  GuideStep,
  { title: string; prompt: string; hints: string[] }
> = {
  purpose: {
    title: "Purpose",
    prompt: "What page are we making?",
    hints: [
      "SaaS product site",
      "Restaurant",
      "Hotel",
      "Law firm",
      "Photography portfolio",
      "Spa",
    ],
  },
  name: {
    title: "Name",
    prompt: "What is it called? This becomes the wordmark at the top of the page.",
    hints: ["Hearth & Rye", "Northroom", "Sunday Press", "Keep it unnamed for now"],
  },
  audience: {
    title: "Audience",
    prompt: "Who should feel at home here? Neighbors, collectors, travelers, clients?",
    hints: ["Neighbors walking by", "Collectors and collaborators", "Weekend visitors"],
  },
  mood: {
    title: "Mood",
    prompt:
      "How should it feel? Warm and paper-like, dark and quiet, coastal, greenhouse… You can also ask to see background or header examples.",
    hints: [
      "Warm and paper-like",
      "Dark gallery",
      "Coastal",
      "Greenhouse",
      "Cool and precise",
      "Quiet navy",
      "Soft spa",
      "Kiln and clay",
    ],
  },
  font: {
    title: "Font",
    prompt: "Which font should the page use?",
    hints: [
      "Inter",
      "Helvetica Neue",
      "Figtree",
      "Newsreader",
      "Georgia",
      "Palatino",
      "Didot",
    ],
  },
  sections: {
    title: "Sections",
    prompt:
      "What belongs on the page besides the opening? Story, offerings, a visit block, a quote?",
    hints: ["Story and hours", "Three offerings", "Story, gallery, visit"],
  },
  imagery: {
    title: "Imagery",
    prompt:
      "Drop in your own photos — JPEG, PNG, or WebP, sharp, and suitable for a public page. Or ask me for background and header examples.",
    hints: ["Browse backgrounds", "Browse header styles", "I will add photos next", "Skip images for now"],
  },
  copy: {
    title: "Words",
    prompt:
      "Any lines you want on the page? A headline, a short story, a button label. If you skip this I will write a draft from what you already told me.",
    hints: ["Write a draft for me", "Headline: Open at first light", "Button: Reserve a table"],
  },
  refine: {
    title: "Refine",
    prompt:
      "Describe how the page should look — darker, a serif, thicker rules, add a visit section — or continue when it feels right.",
    hints: [
      "Make it darker with a serif",
      "Coastal, add a visit section",
      "Thicker rules above headers",
      "Shorter headline",
    ],
  },
  access: {
    title: "Login",
    prompt: "Do you want visitors to sign in on this page?",
    hints: ["No login", "Basic login in the files", "PageBuilder-managed login"],
  },
  complete: {
    title: "Done",
    prompt: "Your page is ready.",
    hints: [],
  },
};

export function nextStep(step: GuideStep): GuideStep {
  if (step === "complete") return "complete";
  if (step === "access") return "complete";
  const index = STEPS.indexOf(step);
  if (index === -1) return "access";
  return STEPS[Math.min(index + 1, STEPS.length - 1)];
}

export function previousStep(step: GuideStep): GuideStep | null {
  if (step === "complete") return "access";
  const index = STEPS.indexOf(step);
  if (index <= 0) return null;
  return STEPS[index - 1];
}

export function isGuideStep(value: string): value is GuideStep {
  return ALL_STEPS.includes(value as GuideStep);
}
