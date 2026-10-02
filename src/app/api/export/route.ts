import { currentUser } from "@/lib/auth";
import { exportHtml, exportLoginHtml } from "@/lib/html-export";
import { requireProject } from "@/lib/project";
import { entitlementsFor, listProjectsForOwner } from "@/lib/store";
import { jsonError, sameOrigin } from "@/lib/security";
import { slugify } from "@/lib/sanitize";

export async function GET(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const user = await currentUser();
  if (!user) return jsonError("Create an account and pay to receive the files.", 401);

  const { project } = await requireProject();
  const pages = await listProjectsForOwner(user.id);
  const entitlement = entitlementsFor(user, project, pages.length);
  if (!entitlement.exportUnlocked) {
    return jsonError("Pay the one-time fee or start a membership to download this page.", 402);
  }

  const url = new URL(request.url);
  const loginFile = url.searchParams.get("file") === "login";
  if (loginFile && project.loginFeature === "none") {
    return jsonError("This page has no login file.", 404);
  }

  const html = loginFile ? exportLoginHtml(project) : await exportHtml(project);
  const name = `${slugify(project.spec.name)}${loginFile ? "-login" : ""}.html`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
