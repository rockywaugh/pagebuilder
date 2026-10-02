import { exportHtml, exportLoginHtml } from "@/lib/html-export";
import { requireProject } from "@/lib/project";
import { jsonError, sameOrigin } from "@/lib/security";

export async function GET(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const { project } = await requireProject();
  const url = new URL(request.url);
  const login = url.searchParams.get("page") === "login";
  if (login && project.loginFeature === "none") {
    return jsonError("This page has no login file.", 404);
  }

  const html = login ? exportLoginHtml(project) : await exportHtml(project);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline; filename=page.html",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
