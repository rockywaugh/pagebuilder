import { applyExample, headerFromExample, searchExamples } from "@/lib/examples-catalog";
import { LIMITS } from "@/lib/config";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject } from "@/lib/store";

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "search"), LIMITS.searchPerHour);
  if (!limited.ok) return jsonError("Too many searches.", 429);

  const query = cleanText(new URL(request.url).searchParams.get("q") || "background", 80);
  const found = searchExamples(query);
  if (!Array.isArray(found)) return jsonError(found.error);
  return Response.json({ examples: found });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);
  const body = (await request.json().catch(() => null)) as { id?: string; query?: string } | null;

  const { user, project } = await requireProject();

  if (body?.query) {
    const limited = rateLimit(clientKey(request, "search"), LIMITS.searchPerHour);
    if (!limited.ok) return jsonError("Too many searches.", 429);
    const found = searchExamples(cleanText(body.query, 80));
    if (!Array.isArray(found)) return jsonError(found.error);
    project.exampleBrowse = {
      items: found,
      selectedId: project.exampleBrowse?.selectedId,
    };
    await saveProject(project);
    return Response.json({
      project: await toPublic(project, user, {
        examples: found,
      }),
    });
  }

  if (!body?.id) return jsonError("Choose an example.");

  const theme = applyExample(project.spec.theme, body.id);
  const header = headerFromExample(body.id);
  project.spec.theme = header ? { ...theme, headerStyle: header } : theme;
  project.previewRevision += 1;
  project.exampleBrowse = {
    items: project.exampleBrowse?.items ?? [],
    selectedId: body.id,
  };
  await saveProject(project);

  return Response.json({
    project: await toPublic(project, user, {
      examples: project.exampleBrowse.items,
    }),
  });
}
