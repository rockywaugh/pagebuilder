import { readPublishedPage } from "@/lib/published";
import { isValidSiteSlug } from "@/lib/site-url";

export async function GET(
  _request: Request,
  context: { params: Promise<{ site: string }> },
) {
  const { site } = await context.params;
  if (!isValidSiteSlug(site)) {
    return new Response("Not found", { status: 404 });
  }

  const html = await readPublishedPage(site, "login");
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "public, max-age=60",
    },
  });
}
