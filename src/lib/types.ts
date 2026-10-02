export type WizardStage = "type" | "mood" | "font" | "done";

export type GuideStep =
  | "purpose"
  | "mood"
  | "font"
  | "name"
  | "audience"
  | "sections"
  | "imagery"
  | "copy"
  | "refine"
  | "access"
  | "complete";

/** Login on the composed page. Hosted login also needs the $5/mo add-on. */
export type LoginFeature = "none" | "code" | "hosted";

export type HeaderStyle = "centered" | "split" | "editorial" | "minimal";
export type FontMood = "serif" | "sans" | "display";
export type SectionType = "story" | "features" | "gallery" | "quote" | "visit";

export type SiteTheme = {
  mood: string;
  bg: string;
  ink: string;
  accent: string;
  muted: string;
  font: FontMood;
  headerStyle: HeaderStyle;
  /** Hairline is 1. Later refine can thicken rules above headers. */
  ruleWeight?: number;
};

export function themeRuleWeight(theme: Pick<SiteTheme, "ruleWeight"> | undefined): number {
  const n = theme?.ruleWeight;
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.min(8, Math.max(1, Math.round(n)));
}

export type SiteSection = {
  id: string;
  type: SectionType;
  title: string;
  body: string;
  imageId?: string;
};

export type SiteSpec = {
  name: string;
  purpose: string;
  audience: string;
  hero: {
    headline: string;
    subhead: string;
    cta: string;
  };
  theme: SiteTheme;
  sections: SiteSection[];
  footer: string;
  backgroundAssetId?: string;
  logoAssetId?: string;
  patternId?: string;
  moodId?: string;
  fontId?: string;
  navTabs?: string[];
  showLogin?: boolean;
  showCheckout?: boolean;
};

export type ChatRole = "assistant" | "user" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
};

export type Asset = {
  id: string;
  filename: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  role: "photo" | "background" | "logo";
  createdAt: string;
};

export type Entitlements = {
  exportUnlocked: boolean;
  membership: boolean;
  hostedLogin: boolean;
  deployPlan: boolean;
  deploySlots: number;
  pageCount: number;
  pageLimit: number;
};

export type Project = {
  id: string;
  ownerId: string | null;
  guestId: string;
  createdAt: string;
  updatedAt: string;
  step: GuideStep;
  messages: ChatMessage[];
  spec: SiteSpec;
  assets: Asset[];
  previewRevision: number;
  exportUnlocked: boolean;
  publishedSlug: string | null;
  guestEmail?: string;
  resumeToken?: string;
  expiresAt?: string | null;
  loginFeature?: LoginFeature;
  wizard?: WizardStage;
  resumeStudio?: boolean;
  exampleBrowse?: {
    items: ExampleItem[];
    selectedId?: string;
  };
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  membership: boolean;
  membershipUntil: string | null;
  hostedLogin?: boolean;
  hostedLoginUntil?: string | null;
  deployPlan?: boolean;
  deployPlanUntil?: string | null;
  stripeCustomerId?: string;
};

export type ExampleItem = {
  id: string;
  kind: "background" | "header" | "palette";
  title: string;
  tags: string[];
  blurb: string;
  swatches?: string[];
  headerStyle?: HeaderStyle;
};

export type SessionPayload = {
  sub: string;
  guestId: string;
  projectId: string;
  email?: string;
  resumeToken?: string;
};
