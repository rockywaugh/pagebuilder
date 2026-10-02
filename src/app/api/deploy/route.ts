import { currentUser } from "@/lib/auth";
import { LIMITS, PRICES } from "@/lib/config";
import { exportHtml, exportLoginHtml } from "@/lib/html-export";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { allocateSiteSlug, rememberSiteSlug, unpublishProject, writePublishedPage } from "@/lib/published";
import { jsonError, sameOrigin } from "@/lib/security";
import { siteLoginPath, sitePath } from "@/lib/site-url";
import { entitlementsFor, listProjectsForOwner, saveProject } from "@/lib/store";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const user = await currentUser();
  if (!user) return jsonError("Create an account first.", 401, { needsAuth: true });

  const { project } = await requireProject();
  const pages = await listProjectsForOwner(user.id);
  const entitlement = entitlementsFor(user, project, pages.length);
  if (!entitlement.membership) {
    return jsonError("A membership is required to publish onto a live URL.", 402, {
      needsMembership: true,
    });
  }
  if (project.loginFeature === "hosted" && !entitlement.hostedLogin) {
    return jsonError("Hosted login needs the $5/month add-on, then deploy on PageBuilder.", 402, {
      needsHostedLogin: true,
    });
  }

  const live = pages.filter((page) => page.publishedSlug && page.id !== project.id);
  if (!project.publishedSlug && live.length >= entitlement.deploySlots) {
    if (entitlement.deploySlots <= LIMITS.deploySlotsDefault) {
      for (const page of live) {
        await unpublishProject(page);
        await saveProject(page);
      }
    } else {
      return jsonError(
        `You can keep ${entitlement.deploySlots} pages live. Undeploy another page first.`,
        402,
        { needsDeploySlot: true },
      );
    }
  }

  const slug = await allocateSiteSlug(project);
  project.publishedSlug = slug;
  const html = await exportHtml(project, { tracking: true });
  await writePublishedPage(slug, "index", html);
  if (project.loginFeature === "hosted") {
    await writePublishedPage(slug, "login", exportLoginHtml(project, { tracking: true }));
  }
  await rememberSiteSlug(slug, project.id);
  await saveProject(project);

  return Response.json({
    slug,
    url: sitePath(slug),
    loginUrl: project.loginFeature === "hosted" ? siteLoginPath(slug) : null,
    replaced: live.length > 0 && entitlement.deploySlots <= LIMITS.deploySlotsDefault,
    project: await toPublic(project, user),
    deploySlots: entitlement.deploySlots,
    deployPrice: PRICES.deployUsd,
  });
}
