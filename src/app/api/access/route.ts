import { currentUser } from "@/lib/auth";
import { LOGIN_FEATURES } from "@/lib/features";
import { STEP_COPY } from "@/lib/guide";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { newId } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { notifyGuestPageReady } from "@/lib/guest";
import { entitlementsFor, listProjectsForOwner, saveProject } from "@/lib/store";
import type { LoginFeature } from "@/lib/types";

function isLoginFeature(value: unknown): value is LoginFeature {
  return value === "none" || value === "code" || value === "hosted";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as { feature?: string } | null;
  if (!isLoginFeature(body?.feature)) {
    return jsonError("Choose a login option.");
  }

  const feature = body.feature;
  const option = LOGIN_FEATURES.find((item) => item.id === feature)!;
  const { user, project } = await requireProject();

  project.loginFeature = feature;
  project.spec = {
    ...project.spec,
    showLogin: feature !== "none",
  };
  project.previewRevision += 1;

  if (feature === "none") {
    project.step = "complete";
    await saveProject(project);
    const guestMail = user ? null : await notifyGuestPageReady(project);
    return Response.json({
      ready: true,
      project: await toPublic(project, user),
      guestMail,
    });
  }

  if (!user) {
    await saveProject(project);
    return Response.json({
      ready: false,
      needsAuth: true,
      feature,
      requirement: option.requires,
      project: await toPublic(project, user),
    });
  }

  const pages = await listProjectsForOwner(user.id);
  const entitlement = entitlementsFor(user, project, pages.length);

  if (!entitlement.membership) {
    await saveProject(project);
    return Response.json({
      ready: false,
      needsMembership: true,
      feature,
      requirement: option.requires,
      project: await toPublic(project, user),
    });
  }

  if (feature === "hosted" && !entitlement.hostedLogin) {
    await saveProject(project);
    return Response.json({
      ready: false,
      needsHostedLogin: true,
      feature,
      requirement: option.requires,
      project: await toPublic(project, user),
    });
  }

  project.step = "complete";
  if (project.messages.at(-1)?.text !== STEP_COPY.complete.prompt) {
    project.messages.push({
      id: newId("msg"),
      role: "assistant",
      text: STEP_COPY.complete.prompt,
      createdAt: new Date().toISOString(),
    });
  }
  await saveProject(project);
  const guestMail = user ? null : await notifyGuestPageReady(project);

  return Response.json({
    ready: true,
    project: await toPublic(project, user),
    guestMail,
  });
}
