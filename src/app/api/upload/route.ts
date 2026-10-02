import { LIMITS } from "@/lib/config";
import { inspectImage } from "@/lib/image-policy";
import { moderateImage } from "@/lib/moderation";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { newId } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject, saveUpload } from "@/lib/store";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const limited = rateLimit(clientKey(request, "upload"), LIMITS.uploadsPerHour);
  if (!limited.ok) {
    return jsonError("Too many uploads. Try again later.", 429);
  }

  const { user, project } = await requireProject();
  if (project.assets.length >= LIMITS.maxUploadsPerProject) {
    return jsonError("This page already has the maximum number of photos.");
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Drop a photo file.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const checked = await inspectImage(bytes, file.name);
  if (!checked.ok) return jsonError(checked.reason);

  const moderated = await moderateImage(checked.webp, "image/webp");
  if (!moderated.ok) return jsonError(moderated.reason);

  const assetId = newId("img");
  await saveUpload(project.id, assetId, checked.webp);
  project.assets.push({
    id: assetId,
    filename: file.name.replace(/[^\w.\-]+/g, "").slice(0, 80),
    mime: "image/webp",
    width: checked.width,
    height: checked.height,
    bytes: checked.webp.byteLength,
    role: project.assets.length === 0 ? "photo" : "photo",
    createdAt: new Date().toISOString(),
  });
  if (!project.spec.backgroundAssetId) {
    project.spec.backgroundAssetId = assetId;
  }
  if (project.spec.sections[0] && !project.spec.sections[0].imageId) {
    project.spec.sections[0] = { ...project.spec.sections[0], imageId: assetId };
  }
  project.previewRevision += 1;
  await saveProject(project);

  return Response.json({
    project: await toPublic(project, user, {
      suggestions: ["Add another photo", "Browse backgrounds", "Continue"],
    }),
  });
}
