import { writeSession } from "@/lib/auth";
import { canCreateAnotherPage, createProject, requireProject } from "@/lib/project";
import { jsonError, sameOrigin } from "@/lib/security";
import { loadProject, saveProject } from "@/lib/store";
import { toPublic } from "@/lib/public-project";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const { user, session } = await requireProject();
  if (!user) return jsonError("Create an account first.", 401, { needsAuth: true });

  const allowed = await canCreateAnotherPage(user.id);
  if (!allowed.ok) return jsonError(allowed.reason, 402, { needsMembership: true });

  const project = createProject(session.guestId, user.id);
  await saveProject(project);
  await writeSession({ ...session, projectId: project.id, email: user.email, sub: user.id });

  return Response.json({ project: await toPublic(project, user) });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);
  const body = (await request.json().catch(() => null)) as {
    projectId?: string;
    view?: string;
  } | null;
  const { user, session } = await requireProject();
  if (!body?.projectId) return jsonError("Missing page.");

  const project = await loadProject(body.projectId);
  if (!project) return jsonError("Page not found.", 404);
  if (project.ownerId && project.ownerId !== user?.id && project.guestId !== session.guestId) {
    return jsonError("That page is not yours.", 403);
  }

  if (body.view === "complete") {
    if (!user?.membership) {
      return jsonError("Your Pages is available with a membership.", 402, {
        needsMembership: true,
      });
    }
    const finished =
      project.step === "complete" || project.loginFeature != null || !!project.publishedSlug;
    if (finished) {
      project.wizard = "done";
      project.resumeStudio = false;
      project.step = "complete";
      await saveProject(project);
    }
  }

  await writeSession({
    ...session,
    projectId: project.id,
    sub: user?.id ?? session.sub,
    email: user?.email,
  });

  return Response.json({ project: await toPublic(project, user) });
}
