import { readPublishedPage } from "@/lib/published";
import { isValidSiteSlug } from "@/lib/site-url";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const form = await request.formData().catch(() => null);
  const site = String(form?.get("site") || "");
  if (!isValidSiteSlug(site)) return jsonError("Unknown page.", 404);

  const html = await readPublishedPage(site, "login");
  if (!html) return new Response("Not found", { status: 404 });

  const notice =
    '<p class="login-note">Visitor accounts are not connected yet. This login is reserved for this page.</p>';
  const body = html.includes("Visitor accounts will connect")
    ? html.replace(
        "Visitor accounts will connect here in a later release.",
        "Visitor accounts are not connected yet. This login is reserved for this page.",
      )
    : html.replace("</form>", `</form>${notice}`);

  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
