import { STEP_COPY } from "@/lib/guide";
import { requireProject } from "@/lib/project";
import { toPublic, wizardStage } from "@/lib/public-project";
import { newId } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject } from "@/lib/store";
import {
  applyFont,
  applyMood,
  applyPattern,
  defaultFontForPattern,
  fontById,
  moodById,
  patternById,
  templateMood,
} from "@/lib/ui-source";

type SetupBody = {
  action?: string;
  patternId?: string;
  moodId?: string;
  fontId?: string;
  stage?: string;
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as SetupBody | null;
  const { user, project } = await requireProject();
  const stage = wizardStage(project);

  const action = body?.action;
  if (
    action !== "select-type" &&
    action !== "advance-type" &&
    action !== "select-mood" &&
    action !== "advance-mood" &&
    action !== "select-font" &&
    action !== "advance-font" &&
    action !== "back" &&
    action !== "reopen"
  ) {
    return jsonError("Unknown setup step.");
  }

  if (action === "reopen") {
    const reopen = body?.stage === "mood" ? "mood" : body?.stage === "font" ? "font" : "type";
    if ((reopen === "mood" || reopen === "font") && !patternById(project.spec.patternId)) {
      return jsonError("Choose a page type first.");
    }
    if (reopen === "font" && !moodById(project.spec.moodId, patternById(project.spec.patternId))) {
      return jsonError("Choose a mood first.");
    }
    project.wizard = reopen;
    project.resumeStudio = true;
    await saveProject(project);
    const publicProject = await toPublic(project, user);
    return Response.json({ project: { ...publicProject, reopenId: newId("reopen") } });
  }

  if (stage === "done") {
    return jsonError("This page is already past setup.");
  }

  if (action === "back") {
    if (stage === "font") {
      project.wizard = "mood";
      await saveProject(project);
      return Response.json({ project: await toPublic(project, user) });
    }
    if (stage !== "mood") return jsonError("Nothing to go back to.");
    const pattern = patternById(project.spec.patternId);
    const keptMood = project.spec.moodId;
    const keptFont = project.spec.fontId;
    if (pattern) {
      project.spec = applyPattern(project.spec, pattern);
      const mood = moodById(keptMood, pattern);
      if (mood) project.spec = applyMood(project.spec, mood);
      const font = fontById(keptFont);
      if (font) project.spec = applyFont(project.spec, font);
      project.previewRevision += 1;
    }
    project.wizard = "type";
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action === "select-type") {
    if (stage !== "type") return jsonError("Choose a page type on this screen.");
    const pattern = patternById(body?.patternId);
    if (!pattern) return jsonError("Choose a page type from the list.");
    const same = project.spec.patternId === pattern.id;
    project.spec = applyPattern(project.spec, pattern);
    if (!same) {
      delete project.spec.moodId;
      delete project.spec.fontId;
    }
    project.previewRevision += 1;
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action === "advance-type") {
    if (stage !== "type") return jsonError("Choose a page type first.");
    const pattern = patternById(project.spec.patternId);
    if (!pattern) {
      return jsonError("Choose a page type first.");
    }
    const mood = moodById(project.spec.moodId, pattern) ?? templateMood(pattern);
    const previous = project.spec.theme;
    const previousMood = project.spec.moodId;
    project.spec = applyMood(project.spec, mood);
    if (
      previousMood !== project.spec.moodId ||
      previous.bg !== project.spec.theme.bg ||
      previous.ink !== project.spec.theme.ink ||
      previous.accent !== project.spec.theme.accent ||
      previous.muted !== project.spec.theme.muted
    ) {
      project.previewRevision += 1;
    }
    project.wizard = "mood";
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action === "select-mood") {
    if (stage !== "mood") return jsonError("Choose a mood on this screen.");
    const pattern = patternById(project.spec.patternId);
    const mood = moodById(body?.moodId, pattern);
    if (!mood) return jsonError("Choose a mood from the list.");
    project.spec = applyMood(project.spec, mood);
    project.previewRevision += 1;
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action === "advance-mood") {
    if (stage !== "mood") return jsonError("Choose a mood first.");
    const pattern = patternById(project.spec.patternId);
    if (!moodById(project.spec.moodId, pattern) || !pattern) {
      return jsonError("Choose a mood first.");
    }
    if (!fontById(project.spec.fontId)) {
      project.spec = applyFont(project.spec, defaultFontForPattern(pattern));
      project.previewRevision += 1;
    }
    project.wizard = "font";
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action === "select-font") {
    if (stage !== "font") return jsonError("Choose a typeface on this screen.");
    const font = fontById(body?.fontId);
    if (!font) return jsonError("Choose a typeface from the list.");
    project.spec = applyFont(project.spec, font);
    project.previewRevision += 1;
    await saveProject(project);
    return Response.json({ project: await toPublic(project, user) });
  }

  if (action !== "advance-font") {
    return jsonError("Unknown setup step.");
  }
  if (stage !== "font") return jsonError("Choose a typeface first.");
  if (
    !fontById(project.spec.fontId) ||
    !moodById(project.spec.moodId, patternById(project.spec.patternId)) ||
    !patternById(project.spec.patternId)
  ) {
    return jsonError("Choose a typeface first.");
  }

  project.wizard = "done";
  project.resumeStudio = false;
  if (project.step === "purpose") {
    project.step = "name";
  }
  project.messages = [
    {
      id: newId("msg"),
      role: "assistant",
      text: STEP_COPY.name.prompt,
      createdAt: new Date().toISOString(),
    },
  ];
  await saveProject(project);
  return Response.json({ project: await toPublic(project, user) });
}
