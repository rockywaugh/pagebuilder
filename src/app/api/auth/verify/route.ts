import { confirmSignup } from "@/lib/signup";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    code?: string;
  } | null;

  const result = confirmSignup({ email: body?.email, code: body?.code });
  if (!result.ok) return jsonError(result.error);
  return Response.json({ ok: true, email: result.email });
}
