import { LIMITS } from "./config";
import { blankSpec } from "./composer";
import { newId } from "./sanitize";
import {
  entitlementsFor,
  listProjectsForOwner,
  loadProject,
  saveProject,
} from "./store";
import { currentUser, fingerprintGuest, readSession, writeSession } from "./auth";
import type { ChatMessage, Project } from "./types";

function welcomeMessage(): ChatMessage {
  return {
    id: newId("msg"),
    role: "assistant",
    text: "Welcome. Choose a page type to begin.",
    createdAt: new Date().toISOString(),
  };
}

export function createProject(guestId: string, ownerId: string | null = null): Project {
  const now = new Date().toISOString();
  return {
    id: newId("prj"),
    ownerId,
    guestId,
    createdAt: now,
    updatedAt: now,
    step: "purpose",
    messages: [welcomeMessage()],
    spec: blankSpec(),
    assets: [],
    previewRevision: 1,
    exportUnlocked: false,
    publishedSlug: null,
    wizard: "type",
  };
}

export async function requireProject() {
  let session = await readSession();
  const user = await currentUser();

  if (!session) {
    const guestId = fingerprintGuest();
    const project = createProject(guestId, user?.id ?? null);
    await saveProject(project);
    session = {
      sub: user?.id ?? guestId,
      guestId,
      projectId: project.id,
      email: user?.email,
    };
    await writeSession(session);
    return { session, user, project };
  }

  let project = await loadProject(session.projectId);
  if (!project) {
    const guestId = session.guestId || fingerprintGuest();
    project = createProject(guestId, user?.id ?? null);
    await saveProject(project);
    session = { ...session, projectId: project.id, guestId };
    await writeSession(session);
  }

  return { session, user, project };
}

export async function canCreateAnotherPage(
  userId: string | null,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!userId || userId.startsWith("guest_")) {
    return { ok: false, reason: "Create an account and start a membership to build more pages." };
  }
  const user = await currentUser();
  const pages = user ? await listProjectsForOwner(user.id) : [];
  const entitlement = entitlementsFor(user, pages[0] ?? createProject("x"), pages.length);
  if (!entitlement.membership && pages.length >= LIMITS.freePageLimit) {
    return {
      ok: false,
      reason: "The first page is free. A membership is required to keep composing additional pages.",
    };
  }
  if (pages.length >= LIMITS.pageLimit) {
    return { ok: false, reason: `You can keep up to ${LIMITS.pageLimit} pages.` };
  }
  return { ok: true };
}
