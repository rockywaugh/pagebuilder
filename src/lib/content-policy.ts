import { looksLikeCodeInjection } from "./sanitize";

const BLOCKED = [
  "ignore previous",
  "ignore all instructions",
  "system prompt",
  "jailbreak",
  "developer mode",
  "exfiltrat",
  "<script",
  "onerror=",
  "javascript:",
  "data:text/html",
  "rm -rf",
  "eval(",
  "child porn",
  "csam",
  "underage",
  "loli",
  "nude",
  "nudity",
  "nsfw",
  "porn",
  "xxx",
  "onlyfans",
  "erotic",
  "explicit sex",
  "gore",
  "beheading",
  "how to make a bomb",
  "credit card dump",
  "phishing",
  "clone paypal",
  "fake bank",
  "steal password",
  "keylogger",
  "ransomware",
  "malware",
  "xss payload",
  "sql injection",
];

const SOURCE_GRAB = [
  "give me the html",
  "show me the source",
  "view source",
  "export the code",
  "download the html",
  "inspect the css",
  "raw html",
  "page source",
];

export type PolicyDecision =
  | { ok: true }
  | { ok: false; reason: string; code: "blocked" | "injection" | "source" };

export function reviewUserText(input: string): PolicyDecision {
  const value = input.toLowerCase();

  if (looksLikeCodeInjection(input)) {
    return {
      ok: false,
      code: "injection",
      reason:
        "That input looks like code or a script. Describe the page in plain language instead.",
    };
  }

  if (BLOCKED.some((term) => value.includes(term))) {
    return {
      ok: false,
      code: "blocked",
      reason:
        "PageBuilder only builds decent, lawful marketing pages. Try a different direction.",
    };
  }

  if (SOURCE_GRAB.some((term) => value.includes(term))) {
    return {
      ok: false,
      code: "source",
      reason:
        "The working preview is a printed image, not a webpage you can inspect. Unlock the page to receive the files.",
    };
  }

  return { ok: true };
}

const SEARCH_BLOCK = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "sexy",
  "lingerie",
  "bikini",
  "gore",
  "blood",
  "weapon",
  "gun",
  "kill",
  "hate",
  "swastika",
];

export function reviewSearchQuery(input: string): PolicyDecision {
  const value = input.toLowerCase();
  if (SEARCH_BLOCK.some((term) => value.includes(term))) {
    return {
      ok: false,
      code: "blocked",
      reason:
        "That search is outside our example library. Try materials, places, palettes, or header styles.",
    };
  }
  return reviewUserText(input);
}

export const IMAGE_NAME_BLOCK = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "xxx",
  "sex",
  "erotic",
  "fetish",
  "gore",
];
