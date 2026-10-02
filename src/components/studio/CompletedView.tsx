"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { PhonePreview } from "./PhonePreview";
import { LIMITS, PRICES, isPlaceholderPageName } from "@/lib/config";
import type { PublicProject } from "@/lib/public-project";

export type StudioPageRow = {
  id: string;
  name: string;
  step?: string;
  updatedAt?: string;
  loginFeature?: string | null;
  publishedSlug?: string | null;
};

export function isStudioPageTab(page: Pick<StudioPageRow, "name" | "step" | "loginFeature" | "publishedSlug">) {
  if (isPlaceholderPageName(page.name)) return false;
  return page.step === "complete" || page.loginFeature != null || !!page.publishedSlug;
}

export function mergeStudioPageTabs(...groups: StudioPageRow[][]) {
  const byId = new Map<string, StudioPageRow>();
  for (const group of groups) {
    for (const page of group) {
      if (!isStudioPageTab(page)) continue;
      const prev = byId.get(page.id);
      byId.set(page.id, prev ? { ...prev, ...page } : page);
    }
  }
  return [...byId.values()];
}

export function CompletedView({
  project,
  pages,
  signedIn,
  memberView,
  resumeUrl,
  onProject,
  onUnlock,
  onAuth,
  onRefresh,
}: {
  project: PublicProject;
  pages: StudioPageRow[];
  signedIn: boolean;
  memberView: boolean;
  resumeUrl?: string | null;
  onProject: (project: PublicProject) => void;
  onUnlock: () => void;
  onAuth: () => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState<"auth" | "membership" | "deploy" | null>(null);
  const [membershipPulse, setMembershipPulse] = useState(0);
  const membershipPanelRef = useRef<HTMLDivElement>(null);
  const membershipButtonRef = useRef<HTMLButtonElement>(null);
  const unlocked = project.entitlements.exportUnlocked;
  const member = project.entitlements.membership;
  const deployPlan = project.entitlements.deployPlan;
  const hasLogin = project.loginFeature === "code" || project.loginFeature === "hosted";

  const tabs = useMemo(() => {
    const seen = new Set<string>();
    const rows: StudioPageRow[] = [];
    for (const page of pages) {
      if (!isStudioPageTab(page) || seen.has(page.id)) continue;
      seen.add(page.id);
      rows.push(page);
    }
    const current: StudioPageRow = { id: project.id, name: project.pageName, step: project.step };
    if (isStudioPageTab(current) && !seen.has(current.id)) {
      rows.unshift(current);
    }
    return rows;
  }, [pages, project.id, project.pageName, project.step]);

  function showMembershipGate() {
    setGate("membership");
    setMembershipPulse((n) => n + 1);
  }

  useEffect(() => {
    if (gate !== "membership" || membershipPulse < 1) return;
    const panel = membershipPanelRef.current;
    const button = membershipButtonRef.current;
    panel?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => button?.focus(), 320);
    return () => window.clearTimeout(timer);
  }, [gate, membershipPulse]);

  async function deploy() {
    setBusy(true);
    setNote("");
    const response = await fetch("/api/deploy", { method: "POST" });
    const data = await response.json();
    setBusy(false);
    if (response.status === 402 && data.needsDeploySlot) {
      setGate("deploy");
      setNote(data.error || "Upgrade to keep two pages live.");
      return;
    }
    if (!response.ok) {
      setNote(data.error || "Deploy needs a membership.");
      return;
    }
    if (data.project) onProject(data.project);
    setNote(
      data.replaced
        ? `Live at ${data.url}. The previous live page was taken down so this one could take the single deploy slot.`
        : `Live at ${data.url}${data.loginUrl ? ` · login ${data.loginUrl}` : ""}`,
    );
  }

  async function modifyPage() {
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
      setNote(data.error || "Could not open the page editor.");
      return;
    }
    onProject(data.project);
  }

  async function openPage(id: string) {
    if (busy || id === project.id) return;
    setBusy(true);
    setNote("");
    const response = await fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setNote(data.error || "Could not open that page.");
      return;
    }
    await onRefresh();
  }

  async function createAnother(force = false) {
    if (busy && !force) return;
    if (tabs.length >= LIMITS.pageLimit || !member) {
      setNote("");
      showMembershipGate();
      return;
    }
    setBusy(true);
    setNote("");
    const response = await fetch("/api/pages", { method: "POST" });
    const data = await response.json();
    setBusy(false);
    if (response.status === 401) {
      setGate("auth");
      setNote(data.error || "Create an account first.");
      return;
    }
    if (response.status === 402 || data.needsMembership) {
      setNote("");
      showMembershipGate();
      return;
    }
    if (!response.ok) {
      setNote(data.error || "Could not start another page.");
      return;
    }
    setGate(null);
    await onRefresh();
  }

  async function pay(kind: "membership" | "deploy") {
    setBusy(true);
    setNote("");
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
      setNote(demoData.error || liveData.error || "Checkout failed.");
      return;
    }
    await onAuth();
    if (kind === "membership") await createAnother(true);
  }

  const actionClass = "border border-ink/15 px-4 py-2 text-sm disabled:opacity-40";
  const primaryClass = "bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-stage">
      <div className="min-h-0 flex-1 overflow-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
            {memberView ? "Your Pages" : "Your page"}
          </p>

          {memberView ? (
            <div className="mt-6 min-w-0">
              <div className="flex h-10 min-w-0 items-end overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div role="tablist" aria-label="Pages" className="flex h-full items-end">
                  {tabs.map((page, index) => {
                    const active = page.id === project.id;
                    const label = page.name.trim();
                    return (
                      <button
                        key={page.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        disabled={busy}
                        title={label}
                        onClick={() => void openPage(page.id)}
                        className={`relative max-w-[11rem] shrink-0 truncate rounded-t-xl px-4 text-left text-sm disabled:opacity-40 ${
                          index > 0 ? "-ml-px" : ""
                        } ${
                          active
                            ? "z-10 h-10 border border-b-0 border-ink/10 bg-paper text-ink"
                            : "z-0 h-9 border border-ink/10 bg-paper-2 text-muted hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    role="tab"
                    aria-label="Create another page"
                    disabled={busy || tabs.length >= LIMITS.pageLimit}
                    onClick={() => void createAnother()}
                    className="relative z-0 -ml-px flex h-9 w-14 shrink-0 items-center justify-center rounded-t-xl border border-ink/10 bg-paper-2 text-xl leading-none text-muted hover:text-ink disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <div className="min-w-0 flex-1 self-stretch border-b border-ink/10" aria-hidden />
              </div>

              <div className="rounded-b-xl border-x border-b border-ink/10 bg-paper">
                <div className="px-4 pt-5 sm:px-6">
                  <h1 className="serif text-4xl">{project.pageName}</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
                    The split studio is done. This is the mobile preview of the page. Pull the files, open them
                    in the browser, or start another page if you have a membership.
                  </p>
                </div>

                <div className="bg-stage px-4 py-8 sm:px-8">
                  <PhonePreview
                    revision={project.previewRevision}
                    alt={`Mobile preview of ${project.pageName}`}
                  />
                </div>

                <div className="flex flex-wrap gap-3 px-4 py-5 sm:px-6">
                  <button type="button" disabled={busy} onClick={() => void modifyPage()} className={actionClass}>
                    Modify page
                  </button>
                  {unlocked ? (
                    <a href="/api/export" className={primaryClass}>
                      Pull files
                    </a>
                  ) : (
                    <button type="button" onClick={onUnlock} className={primaryClass}>
                      Pull files · ${PRICES.exportUsd} or membership
                    </button>
                  )}
                  <a
                    href="/api/preview/html"
                    target="_blank"
                    rel="noreferrer"
                    className={actionClass}
                  >
                    View files in browser
                  </a>
                  {hasLogin && unlocked && project.loginFeature === "code" ? (
                    <a href="/api/export?file=login" className={actionClass}>
                      Download login file
                    </a>
                  ) : null}
                  {member ? (
                    <button type="button" disabled={busy} onClick={() => void deploy()} className={actionClass}>
                      {busy ? "Working…" : project.publishedUrl ? "Update deploy" : "Deploy on PageBuilder"}
                    </button>
                  ) : (
                    <p className="self-center text-xs text-muted">Membership is required to deploy.</p>
                  )}
                  {member && !deployPlan ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void pay("deploy")}
                      className={actionClass}
                    >
                      Two live pages · ${PRICES.deployUsd}/mo
                    </button>
                  ) : null}
                </div>

                {gate === "auth" && !signedIn ? (
                  <div className="border-t border-ink/10 px-4 py-4 sm:px-6">
                    <p className="text-sm text-ink-soft">
                      Create a PageBuilder account, then start a membership to compose another page.
                    </p>
                    <div className="mt-4 max-w-sm">
                      <AuthForm
                        onDone={() => {
                          void (async () => {
                            await onAuth();
                            setGate("membership");
                          })();
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {gate === "membership" ? (
                  <div ref={membershipPanelRef} className="border-t border-ink/10 px-4 py-4 sm:px-6">
                    <p
                      key={membershipPulse}
                      role="status"
                      aria-live="polite"
                      className="pb-alert-flash px-1.5 py-1 text-sm leading-6 text-clay"
                    >
                      Another page template needs a membership (${PRICES.membershipUsd}/mo). You can keep up to{" "}
                      {LIMITS.pageLimit} pages.
                    </p>
                    <button
                      ref={membershipButtonRef}
                      type="button"
                      disabled={busy}
                      onClick={() => void pay("membership")}
                      className={`mt-4 ${primaryClass}`}
                    >
                      Start membership
                    </button>
                  </div>
                ) : null}

                {gate === "deploy" ? (
                  <div className="border-t border-ink/10 px-4 py-4 sm:px-6">
                    <p className="text-sm text-ink-soft">
                      Membership includes one live page at a time. ${PRICES.deployUsd}/mo keeps up to two pages
                      deployed.
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void pay("deploy")}
                      className={`mt-4 ${primaryClass}`}
                    >
                      Add two-page deploy
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-ink/10 bg-paper">
              <div className="px-4 pt-5 sm:px-6">
                <h1 className="serif text-4xl">{project.pageName}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
                  This page is finished. Pull the files or open them in the browser. We emailed a return link
                  {project.guestEmail ? ` to ${project.guestEmail}` : ""} so you can come back later and create
                  an account. Guest pages are removed after {LIMITS.guestTtlDays} days.
                </p>
                {resumeUrl ? (
                  <p className="mt-3 text-sm text-ink-soft">
                    Return link:{" "}
                    <a className="underline" href={resumeUrl}>
                      {resumeUrl}
                    </a>
                  </p>
                ) : null}
              </div>
              <div className="bg-stage px-4 py-8 sm:px-8">
                <PhonePreview
                  revision={project.previewRevision}
                  alt={`Mobile preview of ${project.pageName}`}
                />
              </div>
              <div className="flex flex-wrap gap-3 px-4 py-5 sm:px-6">
                <button type="button" disabled={busy} onClick={() => void modifyPage()} className={actionClass}>
                  Modify page
                </button>
                {unlocked ? (
                  <a href="/api/export" className={primaryClass}>
                    Pull files
                  </a>
                ) : (
                  <button type="button" onClick={onUnlock} className={primaryClass}>
                    Pull files · ${PRICES.exportUsd} or membership
                  </button>
                )}
                <a href="/api/preview/html" target="_blank" rel="noreferrer" className={actionClass}>
                  View files in browser
                </a>
              </div>
            </div>
          )}

          {project.publishedUrl ? (
            <p className="mt-4 text-sm text-ink-soft">
              Live:{" "}
              <a className="underline" href={project.publishedUrl} target="_blank" rel="noreferrer">
                {project.publishedUrl}
              </a>
              {project.siteLoginUrl ? (
                <>
                  {" "}
                  · login{" "}
                  <a className="underline" href={project.siteLoginUrl} target="_blank" rel="noreferrer">
                    {project.siteLoginUrl}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {note ? <p className="mt-3 text-sm text-clay">{note}</p> : null}
        </div>
      </div>
    </section>
  );
}
