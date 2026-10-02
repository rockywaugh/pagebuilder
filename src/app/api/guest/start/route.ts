import { fingerprintGuest, readSession, writeSession } from "@/lib/auth";
import { guestExpiry, resumeUrlFor, upsertGuestToken } from "@/lib/guest";
import { createProject, requireProject } from "@/lib/project";
import { isValidEmail } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject } from "@/lib/store";
import { toPublic } from "@/lib/public-project";
import { cleanText } from "@/lib/sanitize";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = cleanText(body?.email || "", 120).toLowerCase();
  if (!isValidEmail(email)) return jsonError("Use a real email address.");

  const session = await readSession();
  if (session && !session.sub.startsWith("guest_")) {
    return jsonError("You already have an account.");
  }

  if (session?.projectId) {
    const { user, project } = await requireProject();
    if (user) return jsonError("You already have an account.");
    const token = await upsertGuestToken(project, email);
    await saveProject(project);
    await writeSession({
      ...session,
      email,
      resumeToken: token.token,
      projectId: project.id,
    });
    return Response.json({
      ok: true,
      project: await toPublic(project, null),
      resumeUrl: resumeUrlFor(token.token),
    });
  }

  const guestId = fingerprintGuest();
  const project = createProject(guestId);
  project.guestEmail = email;
  project.expiresAt = guestExpiry();
  const token = await upsertGuestToken(project, email);
  await saveProject(project);
  await writeSession({
    sub: guestId,
    guestId,
    projectId: project.id,
    email,
    resumeToken: token.token,
  });

  return Response.json({
    ok: true,
    project: await toPublic(project, null),
    resumeUrl: resumeUrlFor(token.token),
  });
}
