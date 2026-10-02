import { clearSession } from "@/lib/auth";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);
  await clearSession();
  return Response.json({ ok: true });
}
