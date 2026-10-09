import { beginSignup } from "@/lib/signup";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    confirm?: string;
  } | null;

  const result = await beginSignup({
    email: body?.email,
    password: body?.password,
    confirm: body?.confirm,
  });
  if (!result.ok) return jsonError(result.errors[0], 400, { errors: result.errors });

  return Response.json({
    ok: true,
    email: result.email,
    sent: result.sent,
  });
}
