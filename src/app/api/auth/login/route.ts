import { verifyPassword, writeSession } from "@/lib/auth";
import { requireProject } from "@/lib/project";
import { cleanText } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { findUserByEmail, listProjectsForOwner, saveProject } from "@/lib/store";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = cleanText(body?.email || "", 120).toLowerCase();
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(body?.password || "", user.passwordHash))) {
    return jsonError("Email or password is wrong.");
  }

  const { project, session } = await requireProject();
  if (!project.ownerId) {
    project.ownerId = user.id;
    await saveProject(project);
  }

  const owned = await listProjectsForOwner(user.id);
  const activeId = owned[0]?.id || project.id;

  await writeSession({
    sub: user.id,
    guestId: session.guestId,
    projectId: activeId,
    email: user.email,
  });

  return Response.json({ ok: true, email: user.email });
}
