import { currentUser, readSession } from "@/lib/auth";
import { purgeExpiredGuests, resumeUrlFor } from "@/lib/guest";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { listProjectsForOwner } from "@/lib/store";

export async function GET() {
  await purgeExpiredGuests();
  const session = await readSession();
  const user = await currentUser();

  if (!user && !session?.email) {
    return Response.json({
      user: null,
      guest: true,
      needsEmail: true,
      project: null,
      pages: [],
      sessionProjectId: session?.projectId ?? null,
    });
  }

  const { project } = await requireProject();
  const owned = user ? await listProjectsForOwner(user.id) : [];
  const pages = user
    ? owned.some((item) => item.id === project.id)
      ? owned
      : [project, ...owned]
    : [project];

  return Response.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          membership: user.membership,
          membershipUntil: user.membershipUntil,
          hostedLogin: !!user.hostedLogin,
          deployPlan: !!user.deployPlan,
        }
      : null,
    guest: !user,
    needsEmail: false,
    guestEmail: session?.email ?? project.guestEmail ?? null,
    resumeUrl: session?.resumeToken ? resumeUrlFor(session.resumeToken) : null,
    project: await toPublic(project, user),
    pages: pages.map((item) => ({
      id: item.id,
      name: item.spec.name,
      updatedAt: item.updatedAt,
      exportUnlocked: item.exportUnlocked,
      step: item.step,
      loginFeature: item.loginFeature ?? null,
      publishedSlug: item.publishedSlug,
    })),
    sessionProjectId: session?.projectId,
  });
}
