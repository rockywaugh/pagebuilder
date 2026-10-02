import { fingerprintGuest, writeSession } from "@/lib/auth";
import { findGuestToken } from "@/lib/guest";
import { loadProject } from "@/lib/store";
import { toPublic } from "@/lib/public-project";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim() || "";
  if (!token) return jsonError("Missing return link.");

  const record = await findGuestToken(token);
  if (!record) return jsonError("That return link is missing or has expired.", 404);
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return jsonError("That return link has expired.", 410);
  }

  const project = await loadProject(record.projectId);
  if (!project || project.ownerId) {
    return jsonError("That page is no longer available as a guest draft.", 404);
  }

  await writeSession({
    sub: project.guestId || fingerprintGuest(),
    guestId: project.guestId || fingerprintGuest(),
    projectId: project.id,
    email: record.email,
    resumeToken: record.token,
  });

  return Response.json({ ok: true, project: await toPublic(project, null) });
}
