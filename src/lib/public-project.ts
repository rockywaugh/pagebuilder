import { entitlementsFor, listProjectsForOwner } from "./store";
import { STEPS, STEP_COPY } from "./guide";
import { siteLoginPath, sitePath } from "./site-url";
import { fontById, moodById, patternById } from "./ui-source";
import type { Entitlements, ExampleItem, LoginFeature, Project, UserRecord, WizardStage } from "./types";

export type PublicProject = {
  id: string;
  step: Project["step"];
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  wizard: WizardStage;
  resumeStudio: boolean;
  reopenId?: string;
  messages: Project["messages"];
  previewRevision: number;
  entitlements: Entitlements;
  assetCount: number;
  pageName: string;
  suggestions: string[];
  examples?: ExampleItem[];
  selectedExampleId?: string;
  loginFeature: LoginFeature | null;
  publishedSlug: string | null;
  publishedUrl: string | null;
  siteLoginUrl: string | null;
  pattern: { id: string; name: string; market: string; look: string } | null;
  mood: { id: string; name: string; look: string } | null;
  font: { id: string; name: string; look: string } | null;
  guestEmail: string | null;
  expiresAt: string | null;
};

export function wizardStage(project: Pick<Project, "wizard">): WizardStage {
  return project.wizard ?? "done";
}

export async function toPublic(
  project: Project,
  user: UserRecord | null,
  extras?: { suggestions?: string[]; examples?: ExampleItem[] },
): Promise<PublicProject> {
  const pages = user ? await listProjectsForOwner(user.id) : [];
  const pattern = patternById(project.spec.patternId);
  const mood = moodById(project.spec.moodId, pattern);
  const font = fontById(project.spec.fontId);
  return {
    id: project.id,
    step: project.step,
    stepTitle: STEP_COPY[project.step].title,
    stepIndex: project.step === "complete" ? STEPS.length : Math.max(1, STEPS.indexOf(project.step) + 1),
    stepCount: STEPS.length,
    wizard: wizardStage(project),
    resumeStudio: !!project.resumeStudio,
    messages: project.messages,
    previewRevision: project.previewRevision,
    entitlements: entitlementsFor(user, project, pages.length || 1),
    assetCount: project.assets.length,
    pageName: project.spec.name,
    suggestions: extras?.suggestions ?? STEP_COPY[project.step].hints,
    examples: extras?.examples ?? (project.step === "imagery" ? project.exampleBrowse?.items : undefined),
    selectedExampleId: project.exampleBrowse?.selectedId,
    loginFeature: project.loginFeature ?? null,
    publishedSlug: project.publishedSlug,
    publishedUrl: project.publishedSlug ? sitePath(project.publishedSlug) : null,
    siteLoginUrl:
      project.loginFeature === "hosted" && project.publishedSlug
        ? siteLoginPath(project.publishedSlug)
        : null,
    pattern: pattern
      ? { id: pattern.id, name: pattern.name, market: pattern.market, look: pattern.look }
      : null,
    mood: mood ? { id: mood.id, name: mood.name, look: mood.look } : null,
    font: font ? { id: font.id, name: font.name, look: font.look } : null,
    guestEmail: project.guestEmail ?? null,
    expiresAt: project.expiresAt ?? null,
  };
}
