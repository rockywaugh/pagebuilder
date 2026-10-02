import { hashPassword, writeSession } from "@/lib/auth";
import { requireProject } from "@/lib/project";
import { cleanText } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { removeGuestTokensForProject } from "@/lib/guest";
import { findUserByEmail, saveProject, saveUser } from "@/lib/store";
import { newId } from "@/lib/sanitize";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = cleanText(body?.email || "", 120).toLowerCase();
  const password = body?.password || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Use a real email address.");
  }
  if (password.length < 10 || password.length > 72) {
    return jsonError("Password must be 10–72 characters.");
  }

  if (await findUserByEmail(email)) {
    return jsonError("An account with that email already exists.");
  }

  const { project, session } = await requireProject();
  const user = {
    id: newId("usr"),
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    membership: false,
    membershipUntil: null,
    hostedLogin: false,
    hostedLoginUntil: null,
    deployPlan: false,
    deployPlanUntil: null,
  };
  await saveUser(user);
  project.ownerId = user.id;
  project.expiresAt = null;
  await saveProject(project);
  await removeGuestTokensForProject(project.id);
  await writeSession({
    sub: user.id,
    guestId: session.guestId,
    projectId: project.id,
    email: user.email,
  });

  return Response.json({ ok: true, email: user.email });
}
