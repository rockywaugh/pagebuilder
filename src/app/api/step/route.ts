import { STEP_COPY, isGuideStep } from "@/lib/guide";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { newId } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject } from "@/lib/store";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as { step?: string } | null;
  if (!body?.step || !isGuideStep(body.step)) {
    return jsonError("Choose a topic from the list.");
  }

  const { user, project } = await requireProject();
  if (project.step === body.step) {
    return Response.json({ project: await toPublic(project, user) });
  }

  project.step = body.step;
  project.messages.push({
    id: newId("msg"),
    role: "assistant",
    text: STEP_COPY[body.step].prompt,
    createdAt: new Date().toISOString(),
  });
  await saveProject(project);

  return Response.json({
    project: await toPublic(project, user),
  });
}
