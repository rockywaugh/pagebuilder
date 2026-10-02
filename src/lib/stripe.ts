import Stripe from "stripe";
import { PRICES, publicAppUrl } from "./config";

export type CheckoutKind = "export" | "membership" | "hostedLogin" | "deploy";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createCheckout(opts: {
  kind: CheckoutKind;
  email?: string;
  projectId: string;
  userId: string;
  returnTo?: string;
}) {
  const stripe = stripeClient();
  if (!stripe) return null;

  const app = publicAppUrl();
  const exportPrice = process.env.STRIPE_PRICE_EXPORT;
  const memberPrice = process.env.STRIPE_PRICE_MEMBERSHIP;
  const hostedPrice = process.env.STRIPE_PRICE_HOSTED_LOGIN;
  const deployPrice = process.env.STRIPE_PRICE_DEPLOY;
  const returnTo = opts.returnTo === "/account" ? "/account" : "/studio";
  const success = `${app}${returnTo}?paid=${opts.kind}`;
  const cancel = `${app}/studio?checkout=cancel`;

  if (opts.kind === "export") {
    return stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: opts.email,
      success_url: success,
      cancel_url: cancel,
      metadata: {
        kind: "export",
        projectId: opts.projectId,
        userId: opts.userId,
      },
      line_items: exportPrice
        ? [{ price: exportPrice, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: PRICES.exportUsd * 100,
                product_data: { name: "PageBuilder page files" },
              },
            },
          ],
    });
  }

  if (opts.kind === "deploy") {
    return stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: opts.email,
      success_url: success,
      cancel_url: cancel,
      metadata: {
        kind: "deploy",
        projectId: opts.projectId,
        userId: opts.userId,
      },
      line_items: deployPrice
        ? [{ price: deployPrice, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                recurring: { interval: "month" },
                unit_amount: PRICES.deployUsd * 100,
                product_data: { name: "PageBuilder deploy · up to 2 live pages" },
              },
            },
          ],
    });
  }

  if (opts.kind === "hostedLogin") {
    return stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: opts.email,
      success_url: success,
      cancel_url: cancel,
      metadata: {
        kind: "hostedLogin",
        projectId: opts.projectId,
        userId: opts.userId,
      },
      line_items: hostedPrice
        ? [{ price: hostedPrice, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                recurring: { interval: "month" },
                unit_amount: PRICES.hostedLoginUsd * 100,
                product_data: { name: "PageBuilder hosted login" },
              },
            },
          ],
    });
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: opts.email,
    success_url: success,
    cancel_url: cancel,
    metadata: {
      kind: "membership",
      projectId: opts.projectId,
      userId: opts.userId,
    },
    line_items: memberPrice
      ? [{ price: memberPrice, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              unit_amount: PRICES.membershipUsd * 100,
              product_data: { name: "PageBuilder membership" },
            },
          },
        ],
  });
}
