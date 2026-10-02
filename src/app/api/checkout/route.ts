import { currentUser } from "@/lib/auth";
import type { CheckoutKind } from "@/lib/stripe";
import { requireProject } from "@/lib/project";
import { jsonError, sameOrigin } from "@/lib/security";
import { createCheckout } from "@/lib/stripe";

function isKind(value: unknown): value is CheckoutKind {
  return value === "export" || value === "membership" || value === "hostedLogin" || value === "deploy";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const user = await currentUser();
  if (!user) {
    return jsonError("Create an account before paying.", 401, { needsAuth: true });
  }

  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    returnTo?: string;
  } | null;
  const kind: CheckoutKind = isKind(body?.kind) ? body.kind : "export";
  const { project } = await requireProject();

  const session = await createCheckout({
    kind,
    email: user.email,
    projectId: project.id,
    userId: user.id,
    returnTo: body?.returnTo,
  });

  if (!session) {
    return jsonError("Stripe is not configured. Use demo checkout in development.", 503, {
      demo: true,
    });
  }

  return Response.json({ url: session.url });
}
