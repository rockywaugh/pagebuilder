import { stripeClient } from "@/lib/stripe";
import { findUserById, loadProject, saveProject, saveUser } from "@/lib/store";
import { jsonError } from "@/lib/security";

export async function POST(request: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return jsonError("Stripe webhook is not configured.", 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing signature.", 400);

  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return jsonError("Invalid signature.", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const kind = session.metadata?.kind;
    const projectId = session.metadata?.projectId;
    const userId = session.metadata?.userId;
    if (kind === "export" && projectId) {
      const project = await loadProject(projectId);
      if (project) {
        project.exportUnlocked = true;
        await saveProject(project);
      }
    }
    if (kind === "membership" && userId) {
      const user = await findUserById(userId);
      if (user) {
        user.membership = true;
        const until = new Date();
        until.setMonth(until.getMonth() + 1);
        user.membershipUntil = until.toISOString();
        if (typeof session.customer === "string") user.stripeCustomerId = session.customer;
        await saveUser(user);
      }
    }
    if (kind === "deploy" && userId) {
      const user = await findUserById(userId);
      if (user) {
        user.deployPlan = true;
        const until = new Date();
        until.setMonth(until.getMonth() + 1);
        user.deployPlanUntil = until.toISOString();
        if (typeof session.customer === "string") user.stripeCustomerId = session.customer;
        await saveUser(user);
      }
    }
    if (kind === "hostedLogin" && userId) {
      const user = await findUserById(userId);
      if (user) {
        user.hostedLogin = true;
        const until = new Date();
        until.setMonth(until.getMonth() + 1);
        user.hostedLoginUntil = until.toISOString();
        if (typeof session.customer === "string") user.stripeCustomerId = session.customer;
        await saveUser(user);
      }
    }
  }

  return Response.json({ received: true });
}
