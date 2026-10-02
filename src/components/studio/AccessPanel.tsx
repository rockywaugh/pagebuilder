"use client";

import { useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { YourPagesButton } from "./YourPagesButton";
import { LOGIN_FEATURES } from "@/lib/features";
import { PRICES } from "@/lib/config";
import type { LoginFeature } from "@/lib/types";
import type { PublicProject } from "@/lib/public-project";

export function AccessPanel({
  project,
  onProject,
  signedIn,
  onAuth,
  showYourPages = false,
  openingPages = false,
  onYourPages,
}: {
  project: PublicProject;
  onProject: (project: PublicProject) => void;
  signedIn: boolean;
  onAuth: () => Promise<void> | void;
  showYourPages?: boolean;
  openingPages?: boolean;
  onYourPages?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gate, setGate] = useState<"auth" | "membership" | "hosted" | null>(null);
  const pending = useRef<LoginFeature | null>(project.loginFeature);
  const retriedPay = useRef(false);

  async function choose(feature: LoginFeature, force = false) {
    if (busy && !force) return;
    pending.current = feature;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        project?: PublicProject;
        needsAuth?: boolean;
        needsMembership?: boolean;
        needsHostedLogin?: boolean;
      };
      if (data.project) onProject(data.project);
      if (!response.ok) {
        setError(data.error || "Could not save that choice.");
        return;
      }
      if (data.needsAuth) setGate("auth");
      else if (data.needsMembership) setGate("membership");
      else if (data.needsHostedLogin) setGate("hosted");
      else setGate(null);
    } catch {
      setError("Could not save that choice.");
    } finally {
      setBusy(false);
    }
  }

  async function pay(kind: "membership" | "hostedLogin") {
    setBusy(true);
    setError("");
    const live = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, returnTo: "/studio" }),
    });
    const liveData = await live.json();
    if (live.ok && liveData.url) {
      window.location.href = liveData.url;
      return;
    }
    if (live.status === 401) {
      setGate("auth");
      setBusy(false);
      return;
    }
    const demo = await fetch("/api/checkout/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const demoData = await demo.json();
    setBusy(false);
    if (!demo.ok) {
      setError(demoData.error || liveData.error || "Checkout failed.");
      return;
    }
    await onAuth();
    const feature = pending.current;
    if (feature) void choose(feature, true);
  }

  async function goBack() {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/step", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "refine" }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not go back.");
      return;
    }
    onProject(data.project);
  }

  useEffect(() => {
    const paid = new URLSearchParams(window.location.search).get("paid");
    if (!paid || retriedPay.current) return;
    retriedPay.current = true;
    window.history.replaceState({}, "", "/studio");
    const feature = pending.current || (project.loginFeature !== "none" ? project.loginFeature : null);
    if (feature === "code" || feature === "hosted") void choose(feature, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col border-ink/10 bg-paper sm:order-1 sm:w-[42%] sm:max-w-[460px] sm:min-w-[280px] sm:flex-none sm:shrink-0 sm:border-r">
      <div className="min-h-0 flex-1 space-y-5 overflow-auto px-4 py-4">
        <YourPagesButton
          visible={showYourPages}
          busy={openingPages}
          onClick={() => onYourPages?.()}
        />
        <article className="mr-6">
          <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted">PageBuilder</p>
          <p className="serif text-xl leading-7">Do you want visitors to sign in on this page?</p>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Some options need a PageBuilder account. Hosted login also needs a ${PRICES.hostedLoginUsd}/month
            subscription, and the site must go live on PageBuilder.
          </p>
        </article>
        <div className="grid gap-3">
          {LOGIN_FEATURES.map((option) => {
            const selected = pending.current === option.id || project.loginFeature === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => void choose(option.id)}
                className={`px-4 py-3 text-left ${
                  selected ? "bg-ink text-[var(--paper)]" : "border border-ink/15 hover:border-ink/40"
                }`}
              >
                <p className="text-sm font-medium">{option.title}</p>
                <p className={`mt-1 text-xs leading-5 ${selected ? "text-[var(--paper)]/80" : "text-muted"}`}>
                  {option.body}
                  {option.priceNote ? ` ${option.priceNote}.` : ""}
                </p>
              </button>
            );
          })}
        </div>
        {gate === "auth" && !signedIn ? (
          <div className="border border-ink/10 p-4">
            <p className="text-sm">Create a PageBuilder account to continue. Membership is required for login features.</p>
            <div className="mt-4">
              <AuthForm
                onDone={() => {
                  void (async () => {
                    await onAuth();
                    const feature = pending.current;
                    if (feature && feature !== "none") void choose(feature, true);
                  })();
                }}
              />
            </div>
          </div>
        ) : null}
        {gate === "membership" ? (
          <div className="border border-ink/10 p-4">
            <p className="text-sm">
              A membership (${PRICES.membershipUsd}/mo) unlocks login in the files and up to four pages.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay("membership")}
              className="mt-4 bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
            >
              Start membership
            </button>
          </div>
        ) : null}
        {gate === "hosted" ? (
          <div className="border border-ink/10 p-4">
            <p className="text-sm">
              Managed login is ${PRICES.hostedLoginUsd}/month on top of membership. We host it at
              /your-page/login after you deploy.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay("hostedLogin")}
              className="mt-4 bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
            >
              Add hosted login
            </button>
          </div>
        ) : null}
        {error ? <p className="text-xs text-clay">{error}</p> : null}
      </div>
      <div className="border-t border-ink/10 px-4 py-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Login</p>
        <div className="flex justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void goBack()}
            className="border border-ink/20 px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void choose("none")}
            className="bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
          >
            {busy ? "Working…" : "Skip"}
          </button>
        </div>
      </div>
    </section>
  );
}
