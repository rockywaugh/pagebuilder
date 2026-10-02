import { currentUser } from "@/lib/auth";
import { isDemoPayments } from "@/lib/config";
import { requireProject } from "@/lib/project";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject, saveUser } from "@/lib/store";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);
  if (!isDemoPayments()) return jsonError("Demo checkout is disabled when Stripe is configured.", 403);

  const user = await currentUser();
  if (!user) return jsonError("Create an account first.", 401, { needsAuth: true });

  const body = (await request.json().catch(() => null)) as {
    kind?: "export" | "membership" | "hostedLogin" | "deploy";
  } | null;
  const { project } = await requireProject();

  if (body?.kind === "deploy") {
    if (!user.membership) {
      return jsonError("Start a membership before adding extra deploy slots.", 402, {
        needsMembership: true,
      });
    }
    user.deployPlan = true;
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    user.deployPlanUntil = until.toISOString();
    await saveUser(user);
  } else if (body?.kind === "membership") {
    user.membership = true;
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    user.membershipUntil = until.toISOString();
    await saveUser(user);
  } else if (body?.kind === "hostedLogin") {
    if (!user.membership) {
      return jsonError("Start a membership before adding hosted login.", 402, {
        needsMembership: true,
      });
    }
    user.hostedLogin = true;
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    user.hostedLoginUntil = until.toISOString();
    await saveUser(user);
  } else {
    project.exportUnlocked = true;
    await saveProject(project);
  }

  return Response.json({ ok: true });
}
