import { requireProject } from "@/lib/project";
import { renderProjectPng } from "@/lib/preview-render";

export async function GET() {
  const { project } = await requireProject();
  const png = await renderProjectPng(project);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline; filename=preview.png",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
